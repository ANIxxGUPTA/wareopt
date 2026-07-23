package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.InventoryItem;
import com.wareopt.backend.backend.entity.StockMovement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public List<InventoryItem> getAllInventoryItems() {
        return inventoryService.getAllInventoryItems();
    }

    @GetMapping("/low-stock")
    public List<InventoryItem> getLowStockItems() {
        return inventoryService.getLowStockItems();
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<InventoryItem> getInventoryItemById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getInventoryItemById(id));
    }

    @GetMapping("/{id:\\d+}/history")
    public List<StockMovement> getInventoryItemHistory(@PathVariable Long id) {
        return inventoryService.getInventoryItemHistory(id);
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createInventoryItem(@Valid @RequestBody InventoryItem item) {
        InventoryItem savedItem = inventoryService.createInventoryItem(item);
        return new ResponseEntity<>(savedItem, HttpStatus.CREATED);
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<InventoryItem> updateInventoryItem(@PathVariable Long id, @Valid @RequestBody InventoryItem itemDetails) {
        InventoryItem updatedItem = inventoryService.updateInventoryItem(id, itemDetails);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable Long id) {
        inventoryService.deleteInventoryItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    public void exportInventory(jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"inventory_export.csv\"");
        inventoryService.exportCsv(response.getWriter());
    }
}
