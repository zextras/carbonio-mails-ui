/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	PersonalCertificate,
	useCertificatesStore,
	useSmimePasswordStore
} from 'store/certificates/store';

export const getCertificate = ({ accountId }: { accountId: string }): PersonalCertificate | null =>
	useCertificatesStore.getState()?.certificates?.[accountId] ?? null;

export const getCertificatesPassword = (): string =>
	useSmimePasswordStore.getState()?.smimePassword ?? '';
