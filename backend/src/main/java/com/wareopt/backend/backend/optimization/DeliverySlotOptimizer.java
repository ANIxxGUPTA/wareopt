package com.wareopt.backend.backend.optimization;

import com.google.ortools.Loader;
import com.google.ortools.sat.*;
import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.DeliverySlot;
import com.wareopt.backend.backend.entity.SlotAssignment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DeliverySlotOptimizer {

    private static final Logger logger = LoggerFactory.getLogger(DeliverySlotOptimizer.class);
    
    private static final double DEPOT_LAT = 40.7128;
    private static final double DEPOT_LNG = -74.0060;

    static {
        Loader.loadNativeLibraries();
    }

    public List<SlotAssignment> optimize(List<DeliveryOrder> orders, List<DeliverySlot> slots) {
        if (orders.isEmpty()) return new ArrayList<>();

        List<String> validationErrors = new ArrayList<>();
        
        long totalCapacity = slots.stream().mapToLong(s -> (long)(s.getMaxCapacityKg().doubleValue() * 1000)).sum();
        long totalWeight = orders.stream().mapToLong(o -> (long)(o.getWeightKg().doubleValue() * 1000)).sum();
        
        if (totalWeight > totalCapacity) {
            validationErrors.add(String.format("Total weight of all orders (%.1f kg) exceeds the total capacity of all available slots (%.1f kg).", 
                totalWeight / 1000.0, totalCapacity / 1000.0));
        }

        DateTimeFormatter dtFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        for (DeliveryOrder order : orders) {
            long eligibleSlotsCount = slots.stream()
                .filter(s -> !s.getEndTime().isAfter(order.getDeadline()))
                .count();
                
            if (eligibleSlotsCount == 0) {
                validationErrors.add(String.format("Order at %.4f, %.4f has deadline %s which is before every delivery slot's end time — this order can never be delivered.",
                    order.getDestinationLat(), order.getDestinationLng(), order.getDeadline().format(dtFormatter)));
            } else {
                long orderWeight = (long)(order.getWeightKg().doubleValue() * 1000);
                boolean fitsInAnyEligible = slots.stream()
                    .filter(s -> !s.getEndTime().isAfter(order.getDeadline()))
                    .anyMatch(s -> (long)(s.getMaxCapacityKg().doubleValue() * 1000) >= orderWeight);
                    
                if (!fitsInAnyEligible) {
                    validationErrors.add(String.format("Order at %.4f, %.4f weighs %.1f kg, which exceeds the capacity of all delivery slots it is eligible for.",
                        order.getDestinationLat(), order.getDestinationLng(), order.getWeightKg()));
                }
            }
        }
        
        if (!validationErrors.isEmpty()) {
            throw new InfeasibleSolutionException("Delivery optimization cannot proceed due to invalid constraints.", validationErrors);
        }

        CpModel model = new CpModel();
        
        BoolVar[][] y = new BoolVar[orders.size()][slots.size()];

        for (int o = 0; o < orders.size(); o++) {
            DeliveryOrder order = orders.get(o);
            for (int s = 0; s < slots.size(); s++) {
                DeliverySlot slot = slots.get(s);
                if (slot.getEndTime().isAfter(order.getDeadline())) {
                    y[o][s] = null;
                } else {
                    y[o][s] = model.newBoolVar("y_o" + order.getId() + "_s" + slot.getId());
                }
            }
        }

        // Each order exactly 1 slot
        for (int o = 0; o < orders.size(); o++) {
            List<IntVar> orderVars = new ArrayList<>();
            for (int s = 0; s < slots.size(); s++) {
                if (y[o][s] != null) {
                    orderVars.add(y[o][s]);
                }
            }
            if (orderVars.isEmpty()) {
                model.addEquality(model.newConstant(0), 1);
            } else {
                model.addEquality(LinearExpr.sum(orderVars.toArray(new IntVar[0])), 1);
            }
        }

        // Slot capacity
        for (int s = 0; s < slots.size(); s++) {
            DeliverySlot slot = slots.get(s);
            List<IntVar> slotVars = new ArrayList<>();
            long[] weights = new long[orders.size()];
            int count = 0;
            
            for (int o = 0; o < orders.size(); o++) {
                if (y[o][s] != null) {
                    slotVars.add(y[o][s]);
                    weights[count++] = (long) (orders.get(o).getWeightKg().doubleValue() * 1000);
                }
            }
            if (count > 0) {
                long[] actualWeights = new long[count];
                System.arraycopy(weights, 0, actualWeights, 0, count);
                long maxCap = (long) (slot.getMaxCapacityKg().doubleValue() * 1000);
                model.addLessOrEqual(LinearExpr.weightedSum(slotVars.toArray(new IntVar[0]), actualWeights), maxCap);
            }
        }

        // Minimize distance
        List<IntVar> objVars = new ArrayList<>();
        long[] objCoeffs = new long[orders.size() * slots.size()];
        int objCount = 0;

        for (int o = 0; o < orders.size(); o++) {
            DeliveryOrder order = orders.get(o);
            double dist = haversine(DEPOT_LAT, DEPOT_LNG, order.getDestinationLat().doubleValue(), order.getDestinationLng().doubleValue());
            long distScaled = (long) (dist * 1000);
            
            for (int s = 0; s < slots.size(); s++) {
                if (y[o][s] != null) {
                    objVars.add(y[o][s]);
                    objCoeffs[objCount++] = distScaled;
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
            throw new InfeasibleSolutionException("Delivery slot optimization is INFEASIBLE. Cannot assign all orders within capacity and deadlines.");
        }

        List<SlotAssignment> assignments = new ArrayList<>();
        if (status == CpSolverStatus.OPTIMAL || status == CpSolverStatus.FEASIBLE) {
            for (int o = 0; o < orders.size(); o++) {
                for (int s = 0; s < slots.size(); s++) {
                    if (y[o][s] != null && solver.value(y[o][s]) == 1) {
                        SlotAssignment assignment = new SlotAssignment();
                        assignment.setOrder(orders.get(o));
                        assignment.setSlot(slots.get(s));
                        double dist = haversine(DEPOT_LAT, DEPOT_LNG, orders.get(o).getDestinationLat().doubleValue(), orders.get(o).getDestinationLng().doubleValue());
                        assignment.setEstimatedDistanceKm(BigDecimal.valueOf(dist));
                        assignments.add(assignment);
                    }
                }
            }
        }
        
        return assignments;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
