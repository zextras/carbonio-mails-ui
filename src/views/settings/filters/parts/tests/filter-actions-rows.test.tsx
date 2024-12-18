/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';

import { FOLDER_VIEW } from '../../../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import {
	makeListItemsVisible,
	setupTest
} from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';
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
	it('should update actions using same action id as action at index number when selecting a new action', async () => {
		const mockCompProps = {
			...compProps,
			tempActions: [{ id: '7' }, { id: '21' }, { id: '33' }]
		};
		const { user } = setupTest(
			<FilterActionRows
				tmpFilter={{
					actionKeep: [{}]
				}}
				index={1}
				compProps={mockCompProps}
			/>,
			{}
		);
		await user.click(screen.getByText('Keep in Inbox'));
		const dropdown = screen.getByTestId('dropdown-popper-list');
		await user.click(within(dropdown).getByText('Discard'));

		expect(mockCompProps.setTempActions).toHaveBeenCalledWith([
			{ id: '7' },
			{ id: '21', actionDiscard: [{}] },
			{ id: '33' }
		]);
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

		it('should call onChange with empty address after clearing input', async () => {
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
			const chipRemoveIcon = within(redirectToAddressInput).getByTestId('icon: Close');
			await user.click(chipRemoveIcon);

			expect(mockSetActions).toHaveBeenCalledWith([
				expect.objectContaining({ actionRedirect: [{ a: '' }] })
			]);
		});

		it('should inform the user that redirect action is disabled when zimbraFeatureMailForwardingInFiltersEnabled is FALSE on an already existing filter with action redirect', async () => {
			const newCompProps = {
				...compProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
			};

			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionRedirect: [{ flagName: 'flagged' }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			expect(screen.getByText('The Admin disabled the redirect action')).toBeVisible();
		});
		it('Redirect to address should not be the selected option if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			const newCompProps = {
				...compProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
			};

			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionRedirect: [{ flagName: 'flagged' }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			expect(screen.queryByText('Redirect to address')).not.toBeInTheDocument();
		});

		it('should  display Keep in Inbox as selected option if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			const newCompProps = {
				...compProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
			};

			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionRedirect: [{ flagName: 'flagged' }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			expect(screen.getByText('Keep in Inbox')).toBeVisible();
		});

		it('Redirect to address should not be present in the dropdown options if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			const newCompProps = {
				...compProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
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
			await user.click(screen.getByText('Keep in Inbox'));

			expect(
				within(screen.getByTestId('dropdown-popper-list')).queryByText('Redirect to address')
			).not.toBeInTheDocument();
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
		it('should display empty tag in input', async () => {
			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionTag: [{}]
					}}
					index={0}
					compProps={compProps}
				/>,
				{}
			);
			expect(screen.getByText('Tag')).toBeVisible();
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

		// TODO: check if we still want this test since seems hard to retrieve the console error
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

		it('should update tag action value if a new tag is selected', async () => {
			const newCompProps = {
				...compProps,
				tempActions: [{}]
			};
			const { user } = setupTest(
				<FilterActionRows
					tmpFilter={{
						actionTag: [{}]
					}}
					tagOptions={[{ label: 'Tag 1' }]}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			await user.click(screen.getByText('Tag'));
			await user.click(screen.getByText('Tag 1'));

			expect(compProps.setTempActions).toHaveBeenCalledTimes(1);
			expect(compProps.setTempActions).toHaveBeenCalledWith([
				{ actionTag: [{ tagName: 'Tag 1' }], id: undefined }
			]);
		});
		it('should update tag action value if a new tag is selected', async () => {
			const newCompProps = {
				...compProps,
				tempActions: [{}]
			};
			const { user } = setupTest(
				<FilterActionRows
					tmpFilter={{
						actionTag: [{ tagName: 'Tag to remove' }]
					}}
					tagOptions={[{ label: 'Tag 1' }]}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			await user.click(within(screen.getByTestId('tag-input')).getByTestId('icon: Close'));

			expect(compProps.setTempActions).toHaveBeenCalledTimes(1);
			expect(compProps.setTempActions).toHaveBeenCalledWith([
				{ actionTag: [{ tagName: '' }], id: undefined }
			]);
		});
	});
	describe('Move To Folder', () => {
		it('should update the action value with the selected folder on confirm', async () => {
			const store = generateStore();
			const folder = generateFolder({
				id: '100',
				name: 'Test folder'
			});
			const rootFolder = generateFolder({
				id: FOLDERS.USER_ROOT,
				name: 'Root',
				children: [folder]
			});
			populateFoldersStore({
				view: FOLDER_VIEW.message,
				customFolders: [rootFolder]
			});
			const { user } = setupTest(
				<FilterActionRows
					tmpFilter={{
						actionFileInto: [{}]
					}}
					index={0}
					compProps={compProps}
				/>,
				{ store }
			);
			const browseFolder = screen.getByRole('button', {
				name: /browse/i
			});
			await user.click(browseFolder);
			makeListItemsVisible();
			act(() => {
				jest.advanceTimersByTime(1000);
			});
			await user.click(screen.getByTestId(`folder-accordion-item-${folder.id}`));
			const chooseFolder = screen.getByRole('button', { name: 'Choose' });
			expect(chooseFolder).toBeEnabled();
			await user.click(chooseFolder);
			expect(compProps.setTempActions).toHaveBeenCalledWith([
				expect.objectContaining({ actionFileInto: expect.anything() })
			]);
		});
	});
	describe('Discard', () => {
		it('should render the the discard option if selected', async () => {
			setupTest(
				<FilterActionRows
					tmpFilter={{
						actionDiscard: [{}]
					}}
					index={0}
					compProps={compProps}
				/>,
				{}
			);
			expect(await screen.findByText('Discard')).toBeVisible();
		});
		it('should render the the discard option after selecting it', async () => {
			const mockCompProps = {
				...compProps,
				tempActions: [{ id: '1' }]
			};
			const { user } = setupTest(
				<FilterActionRows
					tmpFilter={{
						actionKeep: [{}]
					}}
					index={0}
					compProps={mockCompProps}
				/>,
				{}
			);
			await user.click(screen.getByText('Keep in Inbox'));
			const dropdown = screen.getByTestId('dropdown-popper-list');
			await user.click(within(dropdown).getByText('Discard'));

			expect(await screen.findByText('Discard')).toBeVisible();
		});
	});
});
