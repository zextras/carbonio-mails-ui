/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Certificate, useCertificatesStore, useSmimePasswordStore } from './store';

export const getCertificate = ({ accountId }: { accountId: string }): Certificate | null =>
	useCertificatesStore.getState()?.certificates?.[accountId] ?? null;

export const getCertificatesPassword = (): string =>
	useSmimePasswordStore.getState()?.smimePassword ?? '';
