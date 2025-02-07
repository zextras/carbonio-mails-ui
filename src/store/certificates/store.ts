/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { create } from 'zustand';

export type PersonalCertificate = {
	privateKey: string;
	certificate: string;
	caCertificate: string;
};

type CertificatesState = {
	certificates: Record<string, PersonalCertificate>;
	addCertificate: (accountId: string, certificate: PersonalCertificate) => void;
	removeCertificate: (accountId: string) => void;
	getCertificate: (accountId: string) => PersonalCertificate | undefined;
};
export const useCertificatesStore = create<CertificatesState>((set, get) => ({
	certificates: {},
	addCertificate: (accountId: string, certificate: PersonalCertificate): void =>
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
	getCertificate: (accountId: string): PersonalCertificate | undefined =>
		get().certificates[accountId]
}));

export type SmimePasswordStore = {
	smimePassword: string;
	updateSmimePassword: (value: string) => void;
};

export const useSmimePasswordStore = create<SmimePasswordStore>()((set) => ({
	smimePassword: '',
	updateSmimePassword: (value: string): void => set({ smimePassword: value })
}));

export type SmimeFeatureStore = {
	isSmimeEnabled: boolean;
	updateIsSmimeEnabled: (value: boolean) => void;
};

export const useSmimeFeatureStore = create<SmimeFeatureStore>()((set) => ({
	isSmimeEnabled: false,
	updateIsSmimeEnabled: (value: boolean): void => set({ isSmimeEnabled: value })
}));
