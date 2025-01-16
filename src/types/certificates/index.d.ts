/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type Certificate = {
	id: string; // Certificate ID
	email: string;
	notBefore: number; // Timestamp in milliseconds
	notAfter: number; // Timestamp in milliseconds
	serial: string; // Serial number as a string
	issuer: string; // Issuer's information as a string
	selected: boolean; // Whether the certificate is selected
};
