/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { makeListItemsVisible, setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import CreateFilterModal from 'views/settings/filters/parts/create-filter-modal';

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
		name: 'Filter Name*'
	});
	await user.type(filterInputElement, filterName);
};

describe('create filter modal', () => {
	test('create button is disabled when filter name is empty', async () => {
		setupCreateFilterModal();

		const createButton = screen.getByRole('button', {
			name: 'Create'
		});
		expect(createButton).toBeDisabled();
	});
	test('create button is enabled only when filter name is added', async () => {
		const { user } = setupCreateFilterModal();
		const filterInputElement = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.type(filterInputElement, 'My filter');

		const createButton = screen.getByRole('button', {
			name: 'Create'
		});
		expect(createButton).toBeEnabled();
	});

	test('"Active filter" is unchecked by default', async () => {
		setupCreateFilterModal();

		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		expect(filterActiveUnChecked).toBeVisible();
	});
	test('clicking "Active filter" should check the checkbox', async () => {
		const { user } = setupCreateFilterModal();

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
		const { user } = setupCreateFilterModal();

		await user.click(screen.getByText('Field'));

		const fieldAnyOption = within(screen.getByTestId('dropdown-popper-list')).getByText('any');
		const fieldAllOption = within(screen.getByTestId('dropdown-popper-list')).getByText('all');
		expect(fieldAnyOption).toBeInTheDocument();
		expect(fieldAllOption).toBeInTheDocument();
	});

	test('Move into folder action allows selecting junk folder', async () => {
		const closeModal = vi.fn();
		populateFoldersStore();
		const { user } = setupTest(
			<CreateFilterModal onClose={(): void => closeModal()} onConfirm={vi.fn()} isIncoming />
		);
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
			vi.advanceTimersByTime(500);
		});
		expect(screen.getByText(/junk/i)).toBeVisible();
	});

	it('should call onConfirm with the new filter when clicking create button', async () => {
		const onConfirm = vi.fn();
		const { user } = setupCreateFilterModal({ onConfirm });

		const filterInputElement = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.type(filterInputElement, 'My filter');

		const createButton = screen.getByRole('button', {
			name: 'Create'
		});
		await user.click(createButton);
		expect(onConfirm).toHaveBeenCalledWith({
			active: false,
			name: 'My filter',
			filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
			filterTests: [{ condition: 'anyof' }]
		});
	});
	describe('onConfirm', () => {
		it('should create an "Active" filter', async () => {
			const onConfirm = vi.fn();
			const { user } = setupCreateFilterModal({ onConfirm });
			const filterInputElement = screen.getByRole('textbox', {
				name: 'Filter Name*'
			});
			await user.type(filterInputElement, 'My filter');
			const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
				'icon: Square'
			);
			await act(() => user.click(filterActiveUnChecked));

			const createButton = screen.getByRole('button', {
				name: 'Create'
			});
			await user.click(createButton);

			expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
		});
		describe('Mark As', () => {
			it(' should create a filter with "read" when selecting Mark As by default', async () => {
				const onConfirm = vi.fn();
				const { user } = setupCreateFilterModal({ onConfirm });

				await fillFilterName(user, 'any name');
				const keepInInboxAction = screen.getByText('Keep in Inbox');
				await user.click(keepInInboxAction);
				await user.click(screen.getByText('Mark as'));

				const createButton = screen.getByRole('button', {
					name: 'Create'
				});
				await user.click(createButton);

				expect(onConfirm).toHaveBeenCalledWith(
					expect.objectContaining({
						filterActions: [{ actionFlag: [{ flagName: 'read' }], actionStop: [{}] }]
					})
				);
			});
			it('should display option "read" when switching to "Mark as" action', async () => {
				const { user } = setupCreateFilterModal();

				const keepInInboxAction = screen.getByText('Keep in Inbox');
				await user.click(keepInInboxAction);
				await user.click(screen.getByText('Mark as'));

				expect(screen.getByText('Read')).toBeVisible();
			});
			it('should create a filter with Mark As action Flagged', async () => {
				const onConfirm = vi.fn();
				const { user } = setupCreateFilterModal({ onConfirm });

				await fillFilterName(user, 'any name');
				await user.click(screen.getByText('Keep in Inbox'));
				await user.click(screen.getByText('Mark as'));
				await user.click(screen.getByText('Read'));
				await user.click(screen.getByText('Flagged'));

				const createButton = screen.getByRole('button', {
					name: 'Create'
				});
				await user.click(createButton);

				expect(onConfirm).toHaveBeenCalledWith(
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
				);
			});
			it('should create a filter with Mark As and Redirect To actions', async () => {
				const onConfirm = vi.fn();
				const { user } = setupCreateFilterModal({ onConfirm });

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
					name: 'Create'
				});
				await user.click(createButton);

				expect(onConfirm).toHaveBeenCalledWith(
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
				);
			});
		});

		it('should create a filter with "from" condition', async () => {
			const onConfirm = vi.fn();
			const { user } = setupCreateFilterModal({ onConfirm });

			await fillFilterName(user, 'any name');
			await user.click(screen.getByText('Subject'));
			await user.click(screen.getByText('From'));
			await user.type(
				screen.getByRole('textbox', {
					name: 'Keyword'
				}),
				'anyemail'
			);
			const createButton = screen.getByRole('button', {
				name: 'Create'
			});
			await user.click(createButton);

			expect(onConfirm).toHaveBeenCalledWith(
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
			);
		});

		// FIXME: failing test
		it.skip('should create a filter with multiple "from" condition', async () => {
			const onConfirm = vi.fn();
			const { user } = setupCreateFilterModal({ onConfirm });

			await fillFilterName(user, 'any name');
			await user.click(screen.getByText('Subject'));
			await user.click(screen.getByText('From'));
			await user.type(
				screen.getByRole('textbox', {
					name: 'Keyword'
				}),
				'anyemail'
			);
			await addCondition(user);
			await user.click(screen.getByText('Subject'));
			await user.click(within(screen.getByTestId('dropdown-popper-list')).getByText('From'));
			await user.type(
				screen.getAllByRole('textbox', {
					name: 'Keyword'
				})[1],
				'anotheremail'
			);
			await user.click(
				screen.getByRole('button', {
					name: 'Create'
				})
			);

			expect(onConfirm).toHaveBeenCalledWith(
				expect.objectContaining({
					filterTests: [
						{
							addressTest: [
								{
									header: 'from',
									part: 'all',
									stringComparison: 'contains',
									value: 'anyemail'
								},
								{
									header: 'from',
									part: 'all',
									stringComparison: 'contains',
									value: 'anotheremail'
								}
							],
							condition: 'anyof'
						}
					]
				})
			);
		});

		it('should create a filter with multiple different condition', async () => {
			const onConfirm = vi.fn();
			const { user } = setupCreateFilterModal({ onConfirm });

			await fillFilterName(user, 'any name');
			await user.click(screen.getByText('Subject'));
			await user.click(screen.getByText('From'));
			await user.type(
				screen.getByRole('textbox', {
					name: 'Keyword'
				}),
				'anyemail'
			);
			await addCondition(user);
			await user.type(
				screen.getAllByRole('textbox', {
					name: 'Keyword'
				})[1],
				'anothervalue'
			);
			await user.click(
				screen.getByRole('button', {
					name: 'Create'
				})
			);

			expect(onConfirm).toHaveBeenCalledWith(
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
							headerTest: [
								{
									header: 'subject',
									stringComparison: 'contains',
									value: 'anothervalue'
								}
							],
							condition: 'anyof'
						}
					]
				})
			);
		});

		it('should create a filter without the action removed by clicking MinusOutline', async () => {
			const onConfirm = vi.fn();
			const { user } = setupCreateFilterModal({ onConfirm });

			await fillFilterName(user, 'any name');
			await user.click(screen.getByText('Subject'));
			await user.click(screen.getByText('From'));
			await user.type(
				screen.getByRole('textbox', {
					name: 'Keyword'
				}),
				'anyemail'
			);
			await addCondition(user);
			await user.type(
				screen.getAllByRole('textbox', {
					name: 'Keyword'
				})[1],
				'anothervalue'
			);
			await user.click(
				within(screen.getByTestId('filter-conditions')).getAllByTestId('icon: MinusOutline')[1]
			);
			await user.click(
				screen.getByRole('button', {
					name: 'Create'
				})
			);

			expect(onConfirm).toHaveBeenCalledWith(
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
			);
		});

		it('should create a filter without action stop if "Do not process additional filter" checkbox is disabled', async () => {
			const onConfirm = vi.fn();
			const { user } = setupCreateFilterModal({ onConfirm });

			await fillFilterName(user, 'My Filter');
			await user.click(screen.getByTestId('checkbox'));
			await user.click(
				screen.getByRole('button', {
					name: 'Create'
				})
			);

			expect(onConfirm).toHaveBeenCalledWith({
				active: false,
				name: 'My Filter',
				filterActions: [expect.not.objectContaining({ actionStop: [{}] })],
				filterTests: [{ condition: 'anyof' }]
			});
		});
		// TODO
		// test('isIncoming should define if outgoing or incoming filters should be handled', async () => {
		// 	const closeModal = vi.fn();
		// 	const store = generateStore();
		// 	populateFoldersStore();
		// 	const { user } = setupTest(
		// 		<CreateFilterModal onClose={(): void => closeModal()} onConfirm={vi.fn()} isIncoming />,
		// 		{
		// 			store
		// 		}
		// 	);
		// });
	});
});

const setupCreateFilterModal = ({
	onConfirm = vi.fn()
}: {
	onConfirm?: () => void;
} = {}): ReturnType<typeof setupTest> =>
	setupTest(<CreateFilterModal onClose={vi.fn()} onConfirm={onConfirm} isIncoming />);
