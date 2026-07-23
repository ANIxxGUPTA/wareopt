package com.wareopt.backend.backend.api.dto;

import com.wareopt.backend.backend.entity.MovementReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public class StockMovementRequest {

    @NotNull
    private Integer changeAmount;

    @NotNull
    private MovementReason reason;

    private LocalDate date;

    private String note;

    public Integer getChangeAmount() {
        return changeAmount;
    }

    public void setChangeAmount(Integer changeAmount) {
        this.changeAmount = changeAmount;
    }

    public MovementReason getReason() {
        return reason;
    }

    public void setReason(MovementReason reason) {
        this.reason = reason;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
