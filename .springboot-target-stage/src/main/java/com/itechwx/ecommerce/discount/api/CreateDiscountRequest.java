package com.itechwx.ecommerce.discount.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CreateDiscountRequest(
        @NotBlank @Size(max = 200) String discountName,
        @NotNull @Size(max = 2000) String discountDescription,
        @NotBlank @Pattern(regexp = "fixed_amount|percentage") String discountType,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal discountValue,
        @NotBlank @Size(max = 100) String discountCode,
        @NotNull Instant discountStartDates,
        @NotNull @Future Instant discountEndDates,
        @Min(1) int discountMaxUses,
        Integer discountUsesCount,
        List<String> discountUsersUsed,
        @Min(0) int discountMaxUsesPerUser,
        @NotNull @DecimalMin("0") BigDecimal discountMinOrderValue,
        Boolean discountIsActive,
        @NotBlank @Pattern(regexp = "all|specific") String discountAppliesTo,
        @NotNull @Size(max = 500) List<@NotBlank @Size(max = 128) String> discountProductIds
) {
}
