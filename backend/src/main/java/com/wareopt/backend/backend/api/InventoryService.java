package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.InventoryItem;
import com.wareopt.backend.backend.entity.StockMovement;
import com.wareopt.backend.backend.entity.MovementReason;
import com.wareopt.backend.backend.repository.InventoryItemRepository;
import com.wareopt.backend.backend.repository.StockMovementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    public List<InventoryItem> getAllInventoryItems() {
        return inventoryItemRepository.findAll();
    }

    public List<StockMovement> getInventoryItemHistory(Long inventoryItemId) {
        // Optionally verify if item exists
        getInventoryItemById(inventoryItemId);
        return stockMovementRepository.findByInventoryItemIdOrderByTimestampDesc(inventoryItemId);
    }

    public List<InventoryItem> getLowStockItems() {
        return inventoryItemRepository.findAll().stream()
                .filter(item -> item.getReorderThreshold() != null && item.getQuantityOnHand() <= item.getReorderThreshold())
                .collect(Collectors.toList());
    }

    public InventoryItem getInventoryItemById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found"));
    }

    public InventoryItem createInventoryItem(InventoryItem item) {
        if (item.getQuantityOnHand() == null || item.getQuantityOnHand() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity on hand cannot be negative");
        }
        if (inventoryItemRepository.existsBySku(item.getSku())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An inventory item with this SKU already exists");
        }
        item.setId(null);
        InventoryItem savedItem = inventoryItemRepository.save(item);
        
        if (savedItem.getQuantityOnHand() > 0) {
            StockMovement movement = new StockMovement();
            movement.setInventoryItemId(savedItem.getId());
            movement.setChangeAmount(savedItem.getQuantityOnHand());
            movement.setReason(MovementReason.RESTOCK);
            movement.setNote("Initial stock on creation");
            stockMovementRepository.save(movement);
        }
        
        return savedItem;
    }

    public InventoryItem updateInventoryItem(Long id, InventoryItem itemDetails) {
        if (itemDetails.getQuantityOnHand() == null || itemDetails.getQuantityOnHand() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity on hand cannot be negative");
        }
        if (inventoryItemRepository.existsBySkuAndIdNot(itemDetails.getSku(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An inventory item with this SKU already exists");
        }

        InventoryItem item = getInventoryItemById(id);
        int oldQuantity = item.getQuantityOnHand();

        item.setSku(itemDetails.getSku());
        item.setName(itemDetails.getName());
        item.setDescription(itemDetails.getDescription());
        item.setQuantityOnHand(itemDetails.getQuantityOnHand());
        item.setUnit(itemDetails.getUnit());
        item.setWarehouseLocation(itemDetails.getWarehouseLocation());
        item.setReorderThreshold(itemDetails.getReorderThreshold());
        item.setCostPerUnit(itemDetails.getCostPerUnit());

        InventoryItem savedItem = inventoryItemRepository.save(item);

        if (oldQuantity != itemDetails.getQuantityOnHand()) {
            StockMovement movement = new StockMovement();
            movement.setInventoryItemId(savedItem.getId());
            movement.setChangeAmount(itemDetails.getQuantityOnHand() - oldQuantity);
            movement.setReason(MovementReason.MANUAL_ADJUSTMENT);
            movement.setNote("Manual adjustment via UI");
            stockMovementRepository.save(movement);
        }

        return savedItem;
    }

    public void deleteInventoryItem(Long id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found");
        }
        inventoryItemRepository.deleteById(id);
    }

    public void exportCsv(java.io.PrintWriter writer) {
        try (org.apache.commons.csv.CSVPrinter csvPrinter = new org.apache.commons.csv.CSVPrinter(writer, org.apache.commons.csv.CSVFormat.DEFAULT.builder().setHeader("sku", "name", "description", "quantity", "location", "minStockLevel").build())) {
            List<InventoryItem> items = inventoryItemRepository.findAll();
            for (InventoryItem item : items) {
                csvPrinter.printRecord(
                    item.getSku(),
                    item.getName(),
                    item.getDescription() == null ? "" : item.getDescription(),
                    item.getQuantityOnHand(),
                    item.getWarehouseLocation() == null ? "" : item.getWarehouseLocation(),
                    item.getReorderThreshold() == null ? 0 : item.getReorderThreshold()
                );
            }
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error exporting CSV");
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void importCsv(java.io.InputStream inputStream, com.wareopt.backend.backend.api.dto.CsvImportResult result) {
        try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream));
             org.apache.commons.csv.CSVParser csvParser = new org.apache.commons.csv.CSVParser(reader, org.apache.commons.csv.CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setTrim(true).build())) {
             
             int rowNumber = 1; // Header is 1 conceptually, data starts at 2
             
             for (org.apache.commons.csv.CSVRecord record : csvParser) {
                 rowNumber++;
                 try {
                     String sku = record.get("sku");
                     String name = record.get("name");
                     String description = record.isSet("description") ? record.get("description") : "";
                     String quantityStr = record.get("quantity");
                     String location = record.get("location");
                     String minStockLevelStr = record.isSet("minStockLevel") ? record.get("minStockLevel") : "0";
                     
                     if (sku == null || sku.trim().isEmpty()) {
                         result.addError(rowNumber, "SKU is required");
                         continue;
                     }
                     if (name == null || name.trim().isEmpty()) {
                         result.addError(rowNumber, "Name is required");
                         continue;
                     }
                     if (location == null || location.trim().isEmpty()) {
                         result.addError(rowNumber, "Location is required");
                         continue;
                     }
                     
                     int quantity;
                     try {
                         quantity = Integer.parseInt(quantityStr);
                         if (quantity < 0) {
                             result.addError(rowNumber, "Quantity must be a positive integer");
                             continue;
                         }
                     } catch (NumberFormatException e) {
                         result.addError(rowNumber, "Quantity must be a valid integer");
                         continue;
                     }
                     
                     int minStockLevel = 0;
                     if (!minStockLevelStr.trim().isEmpty()) {
                         try {
                             minStockLevel = Integer.parseInt(minStockLevelStr);
                             if (minStockLevel < 0) {
                                 result.addError(rowNumber, "minStockLevel must be non-negative");
                                 continue;
                             }
                         } catch (NumberFormatException e) {
                             result.addError(rowNumber, "minStockLevel must be a valid integer");
                             continue;
                         }
                     }

                     InventoryItem item = inventoryItemRepository.findBySku(sku).orElse(new InventoryItem());
                     boolean isNew = item.getId() == null;
                     int oldQuantity = isNew ? 0 : item.getQuantityOnHand();
                     
                     item.setSku(sku);
                     item.setName(name);
                     item.setDescription(description);
                     item.setQuantityOnHand(quantity);
                     item.setWarehouseLocation(location);
                     item.setReorderThreshold(minStockLevel);
                     
                     inventoryItemRepository.save(item);
                     
                     if (oldQuantity != quantity) {
                         StockMovement movement = new StockMovement();
                         movement.setInventoryItemId(item.getId());
                         movement.setChangeAmount(quantity - oldQuantity);
                         movement.setReason(isNew ? MovementReason.RESTOCK : MovementReason.MANUAL_ADJUSTMENT);
                         movement.setNote(isNew ? "Initial stock via CSV import" : "Quantity updated via CSV import");
                         stockMovementRepository.save(movement);
                     }
                     
                 } catch (IllegalArgumentException e) {
                     result.addError(rowNumber, "Missing required column(s): " + e.getMessage());
                 }
             }
             
             if (!result.getErrors().isEmpty()) {
                 result.setStatus(400);
                 result.setMessage("CSV Validation Failed");
                 // Trigger rollback
                 throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CSV validation failed");
             }
             
             result.setStatus(200);
             result.setMessage("Import successful");

        } catch (java.io.IOException e) {
            result.setStatus(500);
            result.setMessage("Error reading CSV file");
            result.addError(0, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error reading CSV file");
        }
    }
}
