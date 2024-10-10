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
import { generateStore } from '../../../tests/generators/store';
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
		const store = generateStore();
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		setupTest(<RecoverMessages />, { store });
		expect(screen.getByTestId('recover-messages-form')).toBeInTheDocument();
	});

	it('should not render view if backupSelfUndelete is denied', () => {
		const store = generateStore();
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(false);
		setupTest(<RecoverMessages />, { store });
		expect(screen.queryByTestId('recover-messages-form')).not.toBeInTheDocument();
	});

	it('start recovery button should be disabled if both searchString and dates are not entered', async () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		setupTest(<RecoverMessages />, {});

		const recoveryButton = screen.getByRole('button', {
			name: /label\.search_emails/i
		});
		expect(recoveryButton).toBeDisabled();
	});

	it('should close the recover messages modal when the API call fails', async () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		const { user } = setupTest(<RecoverMessages />, {});
		createAPIInterceptor(
			'get',
			'/zx/backup/v1/searchDeleted',
			HttpResponse.json({}, { status: 500, type: 'error' })
		);

		const dateTimePicker = screen.getByRole('textbox', { name: /label.select_recovery_date/ });
		await user.type(dateTimePicker, '2023-01-05T00:00:00.000Z');
		await user.tab();
		await user.click(
			screen.getByRole('button', {
				name: /label\.search_emails/i
			})
		);
		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /label\.start_search/i
				})
			);
		});

		expect(
			screen.queryByRole('button', {
				name: /label\.start_search/i
			})
		).not.toBeInTheDocument();
	});

	it('should close the modal when the api call succeeds', async () => {
		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		const { user } = setupTest(<RecoverMessages />, {});
		createAPIInterceptor(
			'get',
			'/zx/backup/v1/searchDeleted',
			HttpResponse.json({}, { status: 202 })
		);

		const dateTimePicker = screen.getByRole('textbox', { name: /label.select_recovery_date/ });

		await user.type(dateTimePicker, '2023-01-05T00:00:00.000Z');
		await user.tab();
		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /label\.search_emails/i
				})
			);
		});
		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /label\.start_search/i
				})
			);
		});

		expect(
			screen.queryByRole('button', {
				name: /label\.start_search/i
			})
		).not.toBeInTheDocument();
	});

	it('should always correctly evaluate start and end dates, in function of RECOVER_MESSAGES_INTERVAL', async () => {
		const apiInterceptor = createAPIInterceptor(
			'get',
			'/zx/backup/v1/searchDeleted',
			HttpResponse.json({}, { status: 202 })
		);

		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		const { user } = setupTest(<RecoverMessages />, {});

		const dateTimePicker = screen.getByRole('textbox', { name: /label.select_recovery_date/ });

		const selectedDate = '2024-08-14T00:00:00.000Z';
		await user.type(dateTimePicker, selectedDate);
		await user.tab();
		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /label\.search_emails/i
				})
			);
		});
		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /label\.start_search/i
				})
			);
		});

		const { after, before } = getParams(apiInterceptor.getLastRequest().url);

		expect(after).toBe('2024-08-11T00:00:00.000Z');
		expect(before).toBe('2024-08-17T23:59:59.999Z');
	});

	it('should call searchDeleted API with the correct searchString when one is entered', async () => {
		const apiInterceptor = createAPIInterceptor(
			'get',
			'/zx/backup/v1/searchDeleted',
			HttpResponse.json({}, { status: 202 })
		);

		useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(true);
		const { user } = setupTest(<RecoverMessages />, {});

		const textInput = screen.getByRole('textbox', { name: /settings.keyword/ });

		const expectedSearchString = 'test keyword';
		await user.type(textInput, expectedSearchString);
		await user.tab();
		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /label\.search_emails/i
				})
			);
		});
		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /label\.start_search/i
				})
			);
		});

		const { searchString } = getParams(apiInterceptor.getLastRequest().url);

		expect(searchString).toBe(expectedSearchString);
	});
});
