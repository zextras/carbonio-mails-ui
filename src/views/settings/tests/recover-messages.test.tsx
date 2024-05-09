/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { defaultBeforeAllTests } from '../../../carbonio-ui-commons/test/jest-setup';
import { createAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useAdvancedAccountStore } from '../../../store/zustand/advanced-account/store';
import { RecoverMessages } from '../recover-messages';

function getParams(url: string): Record<string, string> {
	const params = [...new URLSearchParams(new URL(url).searchParams)];
	const rec: Record<string, string> = {};
	params.forEach(([key, value]) => {
		rec[key] = value;
	});
	return rec;
}

describe('Recover messages', () => {
	beforeAll(() => {
		defaultBeforeAllTests({ onUnhandledRequest: 'error' });
	});

	it('should render view if backupSelfUndelete is allowed', () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		setupTest(<RecoverMessages />, {});
		expect(screen.getByTestId('backup-self-undelete-form')).toBeInTheDocument();
	});

	it('should not render view if backupSelfUndelete is denied', () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(false);
		setupTest(<RecoverMessages />, {});
		expect(screen.queryByTestId('backup-self-undelete-form')).not.toBeInTheDocument();
	});

	it('should call undelete API when recovery button is pressed', async () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		jest.useFakeTimers().setSystemTime(new Date('2024-01-01T10:30:35.550Z'));
		const { user } = setupTest(<RecoverMessages />, {});
		const apiInterceptor = createAPIInterceptor(
			'post',
			'/zx/backup/v1/undelete',
			HttpResponse.json(null, { status: 202 })
		);

		await act(async () => {
			await user.click(screen.getByText(/label\.recovery_period/i));
			await user.click(screen.getByText(/label\.last_7_days/i));
			await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
			await user.click(screen.getByRole('button', { name: 'label.confirm' }));
		});

		const { start, end } = getParams((await apiInterceptor).url);
		expect(start).toBeDefined();
		expect(end).toBeDefined();
		expect(start).toBe('2023-12-25T10:30:35.550Z');
		expect(end).toBe('2024-01-01T10:30:35.550Z');
	});

	it('should not close the recover messages modal when the API call fails', async () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		const { user } = setupTest(<RecoverMessages />, {});
		createAPIInterceptor(
			'post',
			'/zx/backup/v1/undelete',
			HttpResponse.json(null, { status: 500 })
		);

		await act(async () => {
			await user.click(screen.getByText(/label\.recovery_period/i));
			await user.click(screen.getByText(/label\.last_7_days/i));
			await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
			await user.click(screen.getByRole('button', { name: 'label.confirm' }));
		});

		expect(screen.getByText('label.confirm')).toBeInTheDocument();
	});

	it('should close the recover messages modal when the API call succedes', async () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		const { user } = setupTest(<RecoverMessages />, {});
		createAPIInterceptor(
			'post',
			'/zx/backup/v1/undelete',
			HttpResponse.json(null, { status: 202 })
		);

		await act(async () => {
			await user.click(screen.getByText(/label\.recovery_period/i));
			await user.click(screen.getByText(/label\.last_7_days/i));
			await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
			await user.click(screen.getByRole('button', { name: 'label.confirm' }));
		});

		expect(screen.queryByText('label.confirm')).not.toBeInTheDocument();
	});

	it('should correcly evaluate 90 days difference between start and end dates', async () => {
		jest.useFakeTimers().setSystemTime(new Date('2024-01-01T10:30:35.550Z'));
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		const { user } = setupTest(<RecoverMessages />, {});
		const apiInterceptor = createAPIInterceptor(
			'post',
			'/zx/backup/v1/undelete',
			HttpResponse.json(null, { status: 202 })
		);

		await act(async () => {
			await user.click(screen.getByText(/label\.recovery_period/i));
			await user.click(screen.getByText(/label\.last_90_days/i));
			await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
			await user.click(screen.getByRole('button', { name: 'label.confirm' }));
		});

		const { start, end } = getParams((await apiInterceptor).url);
		expect(start).toBe('2023-10-03T10:30:35.550Z');
		expect(end).toBe('2024-01-01T10:30:35.550Z');
	});
});
