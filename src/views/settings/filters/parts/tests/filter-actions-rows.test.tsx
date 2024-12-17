/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import FilterActionRows from '../filter-action-rows';

describe('FilterActionsRows', () => {
	const compProps = {
		isIncoming: true,
		setTempActions: jest.fn(),
		tempActions: [],
		zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' as const
	};
	test('minimal setup to not make the component explode', () => {
		setupTest(
			<FilterActionRows
				tmpFilter={{
					anything: [{ flagName: 'flagged' }]
				}}
				index={0}
				compProps={compProps}
			/>,
			{}
		);
	});

	it('adds a new filter condition when the add button is clicked', async () => {
		const newCompProps = {
			...compProps,
			tempActions: [{ actionKeep: [{}] }]
		};
		const { user } = setupTest(
			<FilterActionRows
				tmpFilter={{
					actionKeep: [{}]
				}}
				index={0}
				compProps={newCompProps}
			/>,
			{}
		);
		await user.click(screen.getByTestId('icon: PlusOutline'));

		expect(compProps.setTempActions).toHaveBeenCalledWith([
			{ actionKeep: [{}] },
			expect.objectContaining({
				actionKeep: [{}],
				actionStop: [{}]
			})
		]);
	});

	it('removes a filter condition when the remove button is clicked', async () => {
		const newCompProps = {
			...compProps,
			tempActions: [
				{ id: '1', actionKeep: [{}] },
				{ id: '2', actionStop: [{}] }
			]
		};
		const { user } = setupTest(
			<FilterActionRows
				tmpFilter={{
					anything: [{ flagName: 'flagged' }]
				}}
				index={0}
				compProps={newCompProps}
			/>,
			{}
		);
		await user.click(screen.getByTestId('icon: MinusOutline'));

		expect(compProps.setTempActions).toHaveBeenCalledWith([
			expect.objectContaining({ id: '2', actionStop: [{}] })
		]);
	});

	it('disables the remove button when there is only one filter condition', async () => {
		const newCompProps = {
			...compProps,
			tempActions: [{ id: '1', actionKeep: [{}] }]
		};

		const { user } = setupTest(
			<FilterActionRows
				tmpFilter={{
					anything: [{ flagName: 'flagged' }]
				}}
				index={0}
				compProps={newCompProps}
			/>,
			{}
		);

		const removeButton = screen
			.getAllByRole('button')
			.filter((button) => within(button).queryByTestId('icon: MinusOutline'))[0];
		expect(removeButton).toBeDisabled();
		await user.click(removeButton);
		expect(compProps.setTempActions).not.toHaveBeenCalled();
	});

	describe('Keep In Inbox', () => {
		it('should render the selected action', async () => {
			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionKeep: [{}]
					}}
					index={0}
					compProps={compProps}
				/>,
				{}
			);
			const newLocal = await screen.findByText('Keep in Inbox');
			expect(newLocal).toBeVisible();
		});
	});
	describe('Redirect To Address', () => {
		it('should not display Contact Input when dropdown option is different from "Redirect To Address"', async () => {
			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionStop: [{ flagName: 'flagged' }]
					}}
					index={0}
					compProps={compProps}
				/>,
				{}
			);
			expect(screen.queryByTestId('filter-action-row-contact-input')).not.toBeInTheDocument();
		});
		it('should not display Contact Input when dropdown option is different from "Tag With"', async () => {
			setupTest(
				<FilterActionRows
					tmpFilter={{
						tagWith: [{ flagName: 'flagged' }]
					}}
					index={0}
					compProps={compProps}
				/>,
				{}
			);
			expect(screen.queryByTestId('filter-action-row-contact-input')).not.toBeInTheDocument();
		});
		it('should display Contact Input when selecting option "Redirect To Address"', async () => {
			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionRedirect: [{ flagName: 'flagged' }]
					}}
					index={0}
					compProps={compProps}
				/>,
				{}
			);
			await screen.findByTestId('filter-action-row-contact-input');
		});
		it('should update actions after inserting a value in "Redirect To Address" input', async () => {
			const mockSetActions = jest.fn();
			const mockCompProps = {
				t: jest.fn(),
				isIncoming: true,
				setTempActions: mockSetActions,
				tempActions: [],
				zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' as const
			};
			const { user } = setupTest(
				<FilterActionRows
					tmpFilter={{
						actionRedirect: [{ flagName: 'flagged' }]
					}}
					index={0}
					compProps={mockCompProps}
				/>,
				{}
			);
			const redirectToAddressInput = await screen.findByTestId('filter-action-row-contact-input');
			await user.type(redirectToAddressInput, 'valid@email.it');
			await user.type(redirectToAddressInput, '[Enter]');
			expect(mockSetActions).toHaveBeenCalledWith([
				expect.objectContaining({ actionRedirect: [{ a: 'valid@email.it' }] })
			]);
		});
	});

	describe('Tag With', () => {
		it('should display the saved tag', async () => {
			const filterName = 'Test Designer';
			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionTag: [{ tagName: filterName }]
					}}
					index={0}
					compProps={compProps}
				/>,
				{}
			);
			expect(screen.getByText(filterName)).toBeVisible();
		});
		it('should reset the input value to empty after changing action', async () => {
			const newCompProps = {
				...compProps,
				tempActions: [{}]
			};
			const filterName = 'Test Designer';
			const { user } = setupTest(
				<FilterActionRows
					tmpFilter={{
						actionTag: [{ tagName: filterName }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);
			expect(screen.getByText(filterName)).toBeVisible();

			await user.click(screen.getByText('Tag with'));
			await user.click(screen.getByText('Keep in Inbox'));
			await user.click(screen.getByText('Keep in Inbox'));
			await user.click(screen.getByText('Tag with'));

			expect(screen.queryByText(filterName)).not.toBeInTheDocument();
		});
		it.skip('should break if tempAction is empty and user is switching action', async () => {
			const newCompProps = {
				...compProps,
				tempActions: []
			};
			const filterName = 'Test Designer';
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

			const { user } = setupTest(
				<FilterActionRows
					tmpFilter={{
						actionTag: [{ tagName: filterName }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);
			expect(screen.getByText(filterName)).toBeVisible();
			await user.click(screen.getByText('Tag with'));
			user.click(screen.getByText('Keep in Inbox')).catch((error) => {
				expect(error).toBe('');
			});
		});
	});
});
