/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { GetSignaturesSoapResponse } from 'api/get-signatures-soap-api';

// GetSignatures of an account without signatures: the server leaves signature out (a real response
// from the test server)
export const getSignaturesEmptyResponse = {
	_jsns: 'urn:zimbraAccount'
} satisfies GetSignaturesSoapResponse;
