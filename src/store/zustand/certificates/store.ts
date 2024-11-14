/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { create } from 'zustand';

export type Certificate = {
	privateKey: string;
	endEntityCert: string;
	caCertificate: string;
};

type CertificatesState = {
	certificates: Record<string, Certificate>;
	addCertificate: (accountId: string, certificate: Certificate) => void;
	removeCertificate: (accountId: string) => void;
	getCertificate: (accountId: string) => Certificate | undefined;
};
export const useCertificatesStore = create<CertificatesState>((set, get) => ({
	certificates: {},
	addCertificate: (accountId: string, certificate: Certificate): void =>
		set((state) => ({
			certificates: {
				...state.certificates,
				[accountId]: certificate
			}
		})),
	removeCertificate: (accountId: string): void =>
		set((state) => {
			const { [accountId]: _, ...rest } = state.certificates;
			return { certificates: rest };
		}),
	getCertificate: (accountId: string): Certificate | undefined => get().certificates[accountId]
}));
