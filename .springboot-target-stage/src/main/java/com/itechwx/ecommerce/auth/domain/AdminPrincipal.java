package com.itechwx.ecommerce.auth.domain;

import java.util.Objects;
import java.util.Set;

public record AdminPrincipal(
        String accountId,
        String deviceId,
        String email,
        ActorType actorType,
        Set<String> permissions
) implements ActorPrincipal {

    public AdminPrincipal {
        accountId = Objects.requireNonNull(accountId);
        deviceId = Objects.requireNonNull(deviceId);
        email = Objects.requireNonNull(email);
        actorType = Objects.requireNonNull(actorType);
        if (actorType != ActorType.ADMIN && actorType != ActorType.SUPER_ADMIN) {
            throw new IllegalArgumentException("Admin principal requires an admin actor type");
        }
        permissions = Set.copyOf(permissions);
    }
}
