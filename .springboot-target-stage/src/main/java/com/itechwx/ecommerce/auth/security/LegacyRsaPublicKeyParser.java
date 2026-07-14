package com.itechwx.ecommerce.auth.security;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

final class LegacyRsaPublicKeyParser {

    private static final String PKCS1_BEGIN = "-----BEGIN RSA PUBLIC KEY-----";
    private static final String PKCS1_END = "-----END RSA PUBLIC KEY-----";
    private static final String X509_BEGIN = "-----BEGIN PUBLIC KEY-----";
    private static final String X509_END = "-----END PUBLIC KEY-----";
    private static final byte[] RSA_ALGORITHM_IDENTIFIER = {
            0x30, 0x0d,
            0x06, 0x09, 0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01,
            0x05, 0x00
    };
    private static final int MAX_PEM_CHARACTERS = 16_384;
    private static final int MAX_DER_BYTES = 8_192;

    RSAPublicKey parse(String pem) {
        try {
            if (pem == null || pem.length() > MAX_PEM_CHARACTERS) {
                throw new LegacyAuthenticationException();
            }

            byte[] encoded;
            if (pem.contains(PKCS1_BEGIN)) {
                byte[] pkcs1 = decode(pem, PKCS1_BEGIN, PKCS1_END);
                encoded = wrapPkcs1AsSubjectPublicKeyInfo(pkcs1);
            } else if (pem.contains(X509_BEGIN)) {
                encoded = decode(pem, X509_BEGIN, X509_END);
            } else {
                throw new LegacyAuthenticationException();
            }

            RSAPublicKey key = (RSAPublicKey) KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(encoded));
            int bits = key.getModulus().bitLength();
            if (bits < 2048 || bits > 8192 || key.getPublicExponent().bitLength() < 16) {
                throw new LegacyAuthenticationException();
            }
            return key;
        } catch (LegacyAuthenticationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LegacyAuthenticationException(exception);
        }
    }

    private byte[] decode(String pem, String begin, String end) {
        String normalized = pem.trim();
        int start = normalized.indexOf(begin);
        int finish = normalized.indexOf(end);
        if (start != 0
                || finish <= start
                || finish + end.length() != normalized.length()
                || normalized.indexOf(begin, start + begin.length()) >= 0
                || normalized.indexOf(end, finish + end.length()) >= 0) {
            throw new LegacyAuthenticationException();
        }
        String base64 = normalized.substring(start + begin.length(), finish).replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(base64.getBytes(StandardCharsets.US_ASCII));
        if (decoded.length == 0 || decoded.length > MAX_DER_BYTES) {
            throw new LegacyAuthenticationException();
        }
        return decoded;
    }

    private byte[] wrapPkcs1AsSubjectPublicKeyInfo(byte[] pkcs1) {
        ByteArrayOutputStream bitString = new ByteArrayOutputStream();
        bitString.write(0);
        bitString.writeBytes(pkcs1);

        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.writeBytes(RSA_ALGORITHM_IDENTIFIER);
        body.write(0x03);
        writeLength(body, bitString.size());
        body.writeBytes(bitString.toByteArray());

        ByteArrayOutputStream sequence = new ByteArrayOutputStream();
        sequence.write(0x30);
        writeLength(sequence, body.size());
        sequence.writeBytes(body.toByteArray());
        return sequence.toByteArray();
    }

    private void writeLength(ByteArrayOutputStream output, int length) {
        if (length < 128) {
            output.write(length);
            return;
        }
        int bytes = (Integer.SIZE - Integer.numberOfLeadingZeros(length) + 7) / 8;
        output.write(0x80 | bytes);
        for (int shift = (bytes - 1) * 8; shift >= 0; shift -= 8) {
            output.write((length >> shift) & 0xff);
        }
    }
}
