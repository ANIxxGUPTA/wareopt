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
import java.util.List;

@Service
public class ShiftOptimizer {

    private static final Logger logger = LoggerFactory.getLogger(ShiftOptimizer.class);

    static {
        Loader.loadNativeLibraries();
    }

    public List<ShiftAssignment> optimize(List<Worker> workers, List<Shift> shifts) {
        if (shifts.isEmpty()) return new ArrayList<>();

        List<String> validationErrors = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        for (Shift shift : shifts) {
            long eligibleWorkers = workers.stream()
                .filter(w -> shift.getRequiredSkill() == null || (w.getSkills() != null && w.getSkills().contains(shift.getRequiredSkill())))
                .count();
                
            if (eligibleWorkers == 0 && shift.getRequiredWorkerCount() > 0) {
                validationErrors.add(String.format("No worker has the skill '%s' required by Shift on Day %d %s-%s.",
                    shift.getRequiredSkill() != null ? shift.getRequiredSkill() : "any", shift.getDayOfWeek(), 
                    shift.getStartTime().format(timeFormatter), shift.getEndTime().format(timeFormatter)));
            } else if (eligibleWorkers < shift.getRequiredWorkerCount()) {
                validationErrors.add(String.format("Shift on Day %d %s-%s requires %d workers, but only %d workers have the required skill.",
                    shift.getDayOfWeek(), shift.getStartTime().format(timeFormatter), shift.getEndTime().format(timeFormatter), 
                    shift.getRequiredWorkerCount(), eligibleWorkers));
            }
            
            long hours = Duration.between(shift.getStartTime(), shift.getEndTime()).toHours();
            if (hours < 0) hours += 24;
            
            final long shiftHours = hours;
            boolean anyCanWork = workers.stream()
                .filter(w -> shift.getRequiredSkill() == null || (w.getSkills() != null && w.getSkills().contains(shift.getRequiredSkill())))
                .anyMatch(w -> w.getMaxHoursPerWeek() >= shiftHours);
                
            if (!anyCanWork && eligibleWorkers > 0) {
                validationErrors.add(String.format("Shift on Day %d %s-%s is %d hours long, which exceeds the weekly maximum for all eligible workers.",
                    shift.getDayOfWeek(), shift.getStartTime().format(timeFormatter), shift.getEndTime().format(timeFormatter), shiftHours));
            }
        }
        
        if (!validationErrors.isEmpty()) {
            throw new InfeasibleSolutionException("Shift optimization cannot proceed due to invalid constraints.", validationErrors);
        }

        CpModel model = new CpModel();
        
        BoolVar[][] x = new BoolVar[workers.size()][shifts.size()];

        for (int w = 0; w < workers.size(); w++) {
            Worker worker = workers.get(w);
            List<String> skills = worker.getSkills() == null ? new ArrayList<>() : worker.getSkills();

            for (int s = 0; s < shifts.size(); s++) {
                Shift shift = shifts.get(s);
                boolean eligible = shift.getRequiredSkill() == null || skills.contains(shift.getRequiredSkill());
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
    }
}
