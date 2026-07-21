package com.wareopt.backend.backend.exception;

import com.wareopt.backend.backend.api.dto.ApiError;
import com.wareopt.backend.backend.optimization.InfeasibleSolutionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InfeasibleSolutionException.class)
    public ResponseEntity<ApiError> handleInfeasibleSolution(InfeasibleSolutionException ex) {
        ApiError error = new ApiError(HttpStatus.UNPROCESSABLE_ENTITY.value(), ex.getMessage(), null);
        return new ResponseEntity<>(error, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatusException(ResponseStatusException ex) {
        ApiError error = new ApiError(ex.getStatusCode().value(), ex.getReason(), null);
        return new ResponseEntity<>(error, ex.getStatusCode());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> details = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            details.add(error.getField() + ": " + error.getDefaultMessage());
        }
        ApiError error = new ApiError(HttpStatus.BAD_REQUEST.value(), "Validation Failed", details);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAllExceptions(Exception ex) {
        ex.printStackTrace();
        ApiError error = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An unexpected error occurred: " + ex.getMessage(), null);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
