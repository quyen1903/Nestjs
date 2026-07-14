package com.itechwx.ecommerce.auth.application;

public interface CredentialAttemptStore {

    void recordFailure(String accountId);

    void recordSuccess(String accountId);
}
