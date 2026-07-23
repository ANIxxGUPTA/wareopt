package com.wareopt.backend.backend.optimization;

import com.google.ortools.Loader;
import com.google.ortools.sat.*;
import com.wareopt.backend.backend.entity.Shift;
import com.wareopt.backend.backend.entity.ShiftAssignment;
import com.wareopt.backend.backend.entity.Worker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ShiftOptimizer {

    private static final Logger logger = LoggerFactory.getLogger(ShiftOptimizer.class);

    static {
        Loader.loadNativeLibraries();
    }

    private static class Interval {
        long start, end;
        Interval(long s, long e) { start = s; end = e; }
    }

    private List<Interval> getIntervals(Shift shift) {
        long startMinutes = (shift.getDayOfWeek() - 1) * 24 * 60 + shift.getStartTime().getHour() * 60 + shift.getStartTime().getMinute();
        long endMinutes = (shift.getDayOfWeek() - 1) * 24 * 60 + shift.getEndTime().getHour() * 60 + shift.getEndTime().getMinute();
        
        // Overnight shift validation uses <= now instead of isAfter
        if (!shift.getEndTime().isAfter(shift.getStartTime())) {
            endMinutes = startMinutes + 24 * 60 - (shift.getStartTime().getHour() * 60 + shift.getStartTime().getMinute()) + (shift.getEndTime().getHour() * 60 + shift.getEndTime().getMinute());
            // simpler: endMinutes += 24*60 is wrong if we recalculate it? 
            // Actually, if we just say: endMinutes = (day-1)*24*60 + endHour*60 + endMin
            // Since it's overnight, end is next day, so we add 24*60 to endMinutes.
        }
        
        // Let's recalculate accurately
        long startM = (shift.getDayOfWeek() - 1) * 24 * 60 + shift.getStartTime().getHour() * 60 + shift.getStartTime().getMinute();
        long endM = startM + Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
        if (endM <= startM) endM += 24 * 60;

        List<Interval> intervals = new ArrayList<>();
        if (endM > 7 * 24 * 60) {
            intervals.add(new Interval(startM, 7 * 24 * 60));
            intervals.add(new Interval(0, endM - 7 * 24 * 60));
        } else {
            intervals.add(new Interval(startM, endM));
        }
        return intervals;
    }

    private boolean checkIntervalsOverlap(List<Interval> list1, List<Interval> list2) {
        for (Interval i1 : list1) {
            for (Interval i2 : list2) {
                // Strict overlap: touch is OK
                if (i1.start < i2.end && i2.start < i1.end) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean shiftsOverlap(Shift s1, Shift s2) {
        return checkIntervalsOverlap(getIntervals(s1), getIntervals(s2));
    }

    private boolean hasRequiredSkills(Worker worker, Shift shift) {
        if (shift.getRequiredSkill() == null || shift.getRequiredSkill().trim().isEmpty()) {
            return true;
        }
        if (worker.getSkills() == null || worker.getSkills().isEmpty()) {
            return false;
        }
        
        Set<String> required = Arrays.stream(shift.getRequiredSkill().split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
            
        Set<String> workerSkills = worker.getSkills().stream()
            .flatMap(s -> Arrays.stream(s.split(",")))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
            
        return workerSkills.containsAll(required);
    }

    public List<ShiftAssignment> optimize(List<Worker> workers, List<Shift> shifts) {
        if (shifts.isEmpty()) return new ArrayList<>();

        List<String> validationErrors = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        for (Shift shift : shifts) {
            long eligibleWorkers = workers.stream()
                .filter(w -> hasRequiredSkills(w, shift))
                .count();
                
            if (eligibleWorkers == 0 && shift.getRequiredWorkerCount() > 0) {
                validationErrors.add(String.format("Shift #%d (Day %d %s-%s): No worker has the required skill '%s'.",
                    shift.getId(), shift.getDayOfWeek(), shift.getStartTime().format(timeFormatter), shift.getEndTime().format(timeFormatter),
                    shift.getRequiredSkill() != null ? shift.getRequiredSkill() : "any"));
            } else if (eligibleWorkers < shift.getRequiredWorkerCount()) {
                validationErrors.add(String.format("Shift #%d (Day %d %s-%s): Requires %d workers, but only %d have the required skill.",
                    shift.getId(), shift.getDayOfWeek(), shift.getStartTime().format(timeFormatter), shift.getEndTime().format(timeFormatter), 
                    shift.getRequiredWorkerCount(), eligibleWorkers));
            }
            
            long hours = Duration.between(shift.getStartTime(), shift.getEndTime()).toHours();
            if (hours < 0) hours += 24;
            
            final long shiftHours = hours;
            boolean anyCanWork = workers.stream()
                .filter(w -> hasRequiredSkills(w, shift))
                .anyMatch(w -> w.getMaxHoursPerWeek() >= shiftHours);
                
            if (!anyCanWork && eligibleWorkers > 0) {
                validationErrors.add(String.format("Shift #%d (Day %d %s-%s): Length (%d hours) exceeds the weekly maximum for all eligible workers.",
                    shift.getId(), shift.getDayOfWeek(), shift.getStartTime().format(timeFormatter), shift.getEndTime().format(timeFormatter), shiftHours));
            }
        }
        
        if (!validationErrors.isEmpty()) {
            throw new InfeasibleSolutionException("Shift optimization cannot proceed due to invalid constraints.", validationErrors);
        }

        try {
            CpModel model = new CpModel();
        
        BoolVar[][] x = new BoolVar[workers.size()][shifts.size()];

        for (int w = 0; w < workers.size(); w++) {
            Worker worker = workers.get(w);
            List<String> skills = worker.getSkills() == null ? new ArrayList<>() : worker.getSkills();

            for (int s = 0; s < shifts.size(); s++) {
                Shift shift = shifts.get(s);
                boolean eligible = hasRequiredSkills(worker, shift);
                if (eligible) {
                    x[w][s] = model.newBoolVar("x_w" + worker.getId() + "_s" + shift.getId());
                } else {
                    x[w][s] = null;
                }
            }
        }

        // Coverage constraint
        for (int s = 0; s < shifts.size(); s++) {
            Shift shift = shifts.get(s);
            List<IntVar> shiftVars = new ArrayList<>();
            for (int w = 0; w < workers.size(); w++) {
                if (x[w][s] != null) {
                    shiftVars.add(x[w][s]);
                }
            }
            model.addGreaterOrEqual(LinearExpr.sum(shiftVars.toArray(new IntVar[0])), shift.getRequiredWorkerCount());
        }

        // No Overlap Constraint
        for (int w = 0; w < workers.size(); w++) {
            for (int s1 = 0; s1 < shifts.size(); s1++) {
                if (x[w][s1] == null) continue;
                for (int s2 = s1 + 1; s2 < shifts.size(); s2++) {
                    if (x[w][s2] == null) continue;
                    if (shiftsOverlap(shifts.get(s1), shifts.get(s2))) {
                        model.addLessOrEqual(LinearExpr.sum(new IntVar[]{ x[w][s1], x[w][s2] }), 1);
                    }
                }
            }
        }

        // Max hours constraint
        for (int w = 0; w < workers.size(); w++) {
            Worker worker = workers.get(w);
            List<IntVar> workerVars = new ArrayList<>();
            long[] durations = new long[shifts.size()];
            int count = 0;
            
            for (int s = 0; s < shifts.size(); s++) {
                if (x[w][s] != null) {
                    workerVars.add(x[w][s]);
                    Shift shift = shifts.get(s);
                    long hours = Duration.between(shift.getStartTime(), shift.getEndTime()).toHours();
                    if (hours < 0) hours += 24;
                    durations[count++] = hours;
                }
            }
            
            if (count > 0) {
                long[] actualDurations = new long[count];
                System.arraycopy(durations, 0, actualDurations, 0, count);
                model.addLessOrEqual(LinearExpr.weightedSum(workerVars.toArray(new IntVar[0]), actualDurations), worker.getMaxHoursPerWeek());
            }
        }

        // Objective
        List<IntVar> objVars = new ArrayList<>();
        long[] objCoeffs = new long[workers.size() * shifts.size()];
        int objCount = 0;

        for (int w = 0; w < workers.size(); w++) {
            Worker worker = workers.get(w);
            long hourlyCost = worker.getHourlyCost() == null ? 0 : worker.getHourlyCost().longValue();
            for (int s = 0; s < shifts.size(); s++) {
                if (x[w][s] != null) {
                    Shift shift = shifts.get(s);
                    long hours = Duration.between(shift.getStartTime(), shift.getEndTime()).toHours();
                    if (hours < 0) hours += 24;
                    
                    objVars.add(x[w][s]);
                    objCoeffs[objCount++] = hourlyCost * hours;
                }
            }
        }
        
        long[] actualObjCoeffs = new long[objCount];
        System.arraycopy(objCoeffs, 0, actualObjCoeffs, 0, objCount);
        model.minimize(LinearExpr.weightedSum(objVars.toArray(new IntVar[0]), actualObjCoeffs));

        CpSolver solver = new CpSolver();
        long startTime = System.currentTimeMillis();
        CpSolverStatus status = solver.solve(model);
        long solveTime = System.currentTimeMillis() - startTime;

        logger.info("Solve time: {} ms", solveTime);
        logger.info("Number of variables: {}", model.getBuilder().getVariablesCount());
        logger.info("Number of constraints: {}", model.getBuilder().getConstraintsCount());
        logger.info("Solver status: {}", status);

        if (status == CpSolverStatus.INFEASIBLE) {
            throw new InfeasibleSolutionException("Shift optimization is INFEASIBLE. Not enough eligible workers to cover shifts or hours limit exceeded.");
        }

            List<ShiftAssignment> assignments = new ArrayList<>();
            if (status == CpSolverStatus.OPTIMAL || status == CpSolverStatus.FEASIBLE) {
                for (int w = 0; w < workers.size(); w++) {
                    for (int s = 0; s < shifts.size(); s++) {
                        if (x[w][s] != null && solver.value(x[w][s]) == 1) {
                            ShiftAssignment assignment = new ShiftAssignment();
                            assignment.setWorker(workers.get(w));
                            assignment.setShift(shifts.get(s));
                            assignment.setAssignedAt(LocalDateTime.now());
                            assignments.add(assignment);
                        }
                    }
                }
            }
            return assignments;
        } catch (InfeasibleSolutionException e) {
            throw e;
        } catch (Exception e) {
            logger.error("OR-Tools solver threw an exception: ", e);
            throw new InfeasibleSolutionException("Shift optimization failed due to contradictory constraints.");
        }
    }
}
