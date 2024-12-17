/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { t } from '@zextras/carbonio-shell-ui';

import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import {
	makeListItemsVisible,
	setupTest
} from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';
import CreateFilterModal from '../create-filter-modal';

const addAction = async (user: UserEvent): Promise<void> => {
	await user.click(within(screen.getByTestId('actions-panel')).getByTestId('icon: PlusOutline'));
};
const addCondition = async (user: UserEvent): Promise<void> => {
	await user.click(
		within(screen.getByTestId('filter-conditions')).getByTestId('icon: PlusOutline')
	);
};
const fillFilterName = async (user: UserEvent, filterName: string): Promise<void> => {
	const filterInputElement = screen.getByRole('textbox', {
		name: 'settings.filter_name*'
	});
	await user.type(filterInputElement, filterName);
};

describe('create-filter-modal', () => {
	// TODO: these tests are not really helpful as they test the DS but not component logic
	test('create button is disabled when filter name is empty', async () => {
		const store = generateStore();

		setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});

		const createButton = screen.getByRole('button', {
			name: /label\.create/i
		});
		expect(createButton).toBeDisabled();
	});
	test('create button is enabled only when filter name is added', async () => {
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});
		const filterInputElement = screen.getByRole('textbox', {
			name: 'settings.filter_name*'
		});
		await user.type(filterInputElement, 'My filter');

		const createButton = screen.getByRole('button', {
			name: /label\.create/i
		});
		expect(createButton).toBeEnabled();
	});

	test('"Active filter" is unchecked by default', async () => {
		const store = generateStore();

		setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});

		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		expect(filterActiveUnChecked).toBeVisible();
	});
	test('clicking "Active filter" should check the checkbox', async () => {
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});
		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		await act(() => user.click(filterActiveUnChecked));

		const filterActiveChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: CheckmarkSquare'
		);
		expect(filterActiveChecked).toBeVisible();
	});

	test('Filter conditions should be visible', async () => {
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});
		await user.click(screen.getByText(/settings\.field/i));

		const fieldAnyOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/label\.any/i
		);
		const fieldAllOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/label\.all/i
		);
		expect(fieldAnyOption).toBeInTheDocument();
		expect(fieldAllOption).toBeInTheDocument();
	});

	test('Move into folder action allows selecting junk folder', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const { user } = setupTest(<CreateFilterModal t={t} onClose={(): void => closeModal()} />, {
			store
		});
		await user.click(screen.getByText('Keep in Inbox'));

		await user.click(screen.getByText('Move Into Folder'));
		const button = screen.getByRole('button', {
			name: 'Browse'
		});
		await act(async () => {
			await user.click(button);
		});

		makeListItemsVisible();
		act(() => {
			jest.advanceTimersByTime(500);
		});
		expect(screen.getByText(/junk/i)).toBeVisible();
	});

	it('should call ModifyFiltersRule API when clicking create button', async () => {
		const store = generateStore();

		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});
		const filterInputElement = screen.getByRole('textbox', {
			name: 'settings.filter_name*'
		});
		await user.type(filterInputElement, 'My filter');

		const createButton = screen.getByRole('button', {
			name: /label\.create/i
		});
		await user.click(createButton);
		const request = await modifyFilterRulesInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						{
							active: false,
							name: 'My filter',
							filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
							filterTests: [{ condition: 'anyof' }]
						}
					]
				}
			]
		});
	});
	describe('ModifyFilterRules API', () => {
		test('create an "Active" filter', async () => {
			const store = generateStore();

			const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
			const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
				store
			});
			const filterInputElement = screen.getByRole('textbox', {
				name: 'settings.filter_name*'
			});
			await user.type(filterInputElement, 'My filter');
			const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
				'icon: Square'
			);
			await act(() => user.click(filterActiveUnChecked));

			const createButton = screen.getByRole('button', {
				name: /label\.create/i
			});
			await user.click(createButton);
			const request = await modifyFilterRulesInterceptor;
			expect(request).toEqual({
				_jsns: 'urn:zimbraMail',
				filterRules: [
					{
						filterRule: [expect.objectContaining({ active: true })]
					}
				]
			});
		});
		test('create a filter with Mark As action does not work if mark as flag (read, flagged) is untouched', async () => {
			const store = generateStore();

			const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
			const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
				store
			});
			await fillFilterName(user, 'any name');
			const keepInInboxAction = screen.getByText('Keep in Inbox');
			await user.click(keepInInboxAction);
			await user.click(screen.getByText('Mark as'));

			const createButton = screen.getByRole('button', {
				name: /label\.create/i
			});
			await user.click(createButton);

			const request = await modifyFilterRulesInterceptor;
			expect(request).toEqual({
				_jsns: 'urn:zimbraMail',
				filterRules: [
					{
						filterRule: [
							expect.objectContaining({ filterActions: [{ actionKeep: [{}], actionStop: [{}] }] })
						]
					}
				]
			});
		});
		test('create a filter with Mark As action Flagged', async () => {
			const store = generateStore();

			const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
			const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
				store
			});
			await fillFilterName(user, 'any name');
			await user.click(screen.getByText('Keep in Inbox'));
			await user.click(screen.getByText('Mark as'));
			await user.click(screen.getByText('Read'));
			await user.click(screen.getByText('Flagged'));

			const createButton = screen.getByRole('button', {
				name: /label\.create/i
			});
			await user.click(createButton);

			const request = await modifyFilterRulesInterceptor;
			expect(request).toEqual({
				_jsns: 'urn:zimbraMail',
				filterRules: [
					{
						filterRule: [
							expect.objectContaining({
								filterActions: [
									{
										actionFlag: [
											{
												flagName: 'flagged'
											}
										],
										actionStop: [{}]
									}
								]
							})
						]
					}
				]
			});
		});
		test('create a filter with Mark As and Redirect To actions', async () => {
			const store = generateStore();

			const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
			const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
				store
			});
			await fillFilterName(user, 'any name');

			await user.click(screen.getByText('Keep in Inbox'));
			await user.click(screen.getByText('Mark as'));
			await user.click(screen.getByText('Read'));
			await user.click(screen.getByText('Flagged'));

			await addAction(user);
			await user.click(screen.getByText('Keep in Inbox'));
			await user.click(screen.getByText('Redirect to address'));
			const redirectToAddressInput = await screen.findByTestId('filter-action-row-contact-input');
			await user.type(redirectToAddressInput, 'redirectTo@email.com');
			await user.type(redirectToAddressInput, '[Enter]');

			const createButton = screen.getByRole('button', {
				name: /label\.create/i
			});
			await user.click(createButton);

			const request = await modifyFilterRulesInterceptor;
			expect(request).toEqual({
				_jsns: 'urn:zimbraMail',
				filterRules: [
					{
						filterRule: [
							expect.objectContaining({
								filterActions: [
									{
										actionFlag: [
											{
												flagName: 'flagged'
											}
										],
										actionRedirect: [
											{
												a: 'redirectTo@email.com'
											}
										],
										actionStop: [{}]
									}
								]
							})
						]
					}
				]
			});
		});
		test('create a filter with "from" condition', async () => {
			const store = generateStore();

			const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
			const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
				store
			});
			await fillFilterName(user, 'any name');

			await user.click(screen.getByText('label.subject'));
			await user.click(screen.getByText('label.from'));
			await user.type(
				screen.getByRole('textbox', {
					name: 'settings.keyword'
				}),
				'anyemail'
			);

			const createButton = screen.getByRole('button', {
				name: /label\.create/i
			});
			await user.click(createButton);

			const request = await modifyFilterRulesInterceptor;
			expect(request).toEqual({
				_jsns: 'urn:zimbraMail',
				filterRules: [
					{
						filterRule: [
							expect.objectContaining({
								filterTests: [
									{
										addressTest: [
											{
												header: 'from',
												part: 'all',
												stringComparison: 'contains',
												value: 'anyemail'
											}
										],
										condition: 'anyof'
									}
								]
							})
						]
					}
				]
			});
		});
	});
});
