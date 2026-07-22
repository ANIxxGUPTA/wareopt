package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.InventoryItem;
import com.wareopt.backend.backend.repository.InventoryItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private InventoryItem validItem;

    @BeforeEach
    void setUp() {
        validItem = new InventoryItem();
        validItem.setId(1L);
        validItem.setSku("SKU-123");
        validItem.setName("Test Item");
        validItem.setQuantityOnHand(100);
    }

    @Test
    void createInventoryItem_success() {
        when(inventoryItemRepository.existsBySku("SKU-123")).thenReturn(false);
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(validItem);

        InventoryItem result = inventoryService.createInventoryItem(validItem);

        assertNotNull(result);
        assertEquals("SKU-123", result.getSku());
        verify(inventoryItemRepository).save(any(InventoryItem.class));
    }

    @Test
    void createInventoryItem_negativeQuantity_throwsBadRequest() {
        validItem.setQuantityOnHand(-5);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            inventoryService.createInventoryItem(validItem);
        });

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("negative"));
        verify(inventoryItemRepository, never()).save(any());
    }

    @Test
    void createInventoryItem_duplicateSku_throwsConflict() {
        when(inventoryItemRepository.existsBySku("SKU-123")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            inventoryService.createInventoryItem(validItem);
        });

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("exists"));
        verify(inventoryItemRepository, never()).save(any());
    }

    @Test
    void updateInventoryItem_success() {
        when(inventoryItemRepository.existsBySkuAndIdNot("SKU-123", 1L)).thenReturn(false);
        when(inventoryItemRepository.findById(1L)).thenReturn(Optional.of(validItem));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(validItem);

        InventoryItem result = inventoryService.updateInventoryItem(1L, validItem);

        assertNotNull(result);
        assertEquals("SKU-123", result.getSku());
        verify(inventoryItemRepository).save(any(InventoryItem.class));
    }

    @Test
    void getLowStockItems_returnsCorrectItems() {
        InventoryItem lowStock = new InventoryItem();
        lowStock.setSku("LOW-1");
        lowStock.setQuantityOnHand(5);
        lowStock.setReorderThreshold(10);

        InventoryItem fineStock = new InventoryItem();
        fineStock.setSku("FINE-1");
        fineStock.setQuantityOnHand(20);
        fineStock.setReorderThreshold(10);

        InventoryItem nullThreshold = new InventoryItem();
        nullThreshold.setSku("NULL-1");
        nullThreshold.setQuantityOnHand(2);
        nullThreshold.setReorderThreshold(null);

        when(inventoryItemRepository.findAll()).thenReturn(List.of(lowStock, fineStock, nullThreshold));

        List<InventoryItem> result = inventoryService.getLowStockItems();

        assertEquals(1, result.size());
        assertEquals("LOW-1", result.get(0).getSku());
    }
}
