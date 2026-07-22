package com.wareopt.backend.backend.optimization;

import java.util.List;

public class InfeasibleSolutionException extends RuntimeException {
    private final List<String> reasons;

    public InfeasibleSolutionException(String message) {
        super(message);
        this.reasons = null;
    }

    public InfeasibleSolutionException(String message, List<String> reasons) {
        super(message);
        this.reasons = reasons;
    }

    public List<String> getReasons() {
        return reasons;
    }
}
