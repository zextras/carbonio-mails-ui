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
import { CompProps, FilterAction } from '../../../../../types';
import { FilterActionRow } from '../filter-action-row';

const REDIRECT_TO_ADDRESS = /Redirect To Address/i;
describe('FilterActionsRows', () => {
	const defaultAction: FilterAction = { actionKeep: [{}] };
	const defaultProps = {
		isIncomingFilter: true,
		mailForwardingEnabled: 'TRUE' as const,
		tagOptions: [],
		defaultAction,
		onAddNewAction: jest.fn(),
		onRemoveAction: jest.fn(),
		onActionSwitch: jest.fn(),
		disableRemove: false,
		onDefaultActionValueChange: jest.fn()
	};
	it('adds a new filter condition when the add button is clicked', async () => {
		const testProps = {
			...defaultProps,
			tempActions: [{ actionKeep: [{}] }]
		};
		const { user } = setupTest(<FilterActionRow {...testProps} />, {});
		await user.click(screen.getByTestId('icon: PlusOutline'));

		expect(defaultProps.onAddNewAction).toHaveBeenCalledWith(
			expect.objectContaining({
				actionKeep: [{}],
				actionStop: [{}]
			})
		);
	});
	it('removes a filter condition when the remove button is clicked', async () => {
		const newCompProps: CompProps = {
			...defaultProps,
			tempActions: [
				{ id: '1', actionKeep: [{}] },
				{ id: '2', actionFileInto: [{}] }
			]
		};
		const { user } = setupTest(
			<FilterActionRow
				defaultAction={{
					actionKeep: [{}]
				}}
				index={0}
				compProps={newCompProps}
			/>,
			{}
		);
		await user.click(screen.getByTestId('icon: MinusOutline'));

		expect(defaultProps.setTempActions).toHaveBeenCalledWith([
			expect.objectContaining({ id: '2', actionFileInto: [{}] })
		]);
	});
	it('disables the remove button when there is only one filter condition', async () => {
		const newCompProps: CompProps = {
			...defaultProps,
			tempActions: [{ id: '1', actionKeep: [{}] }]
		};

		const { user } = setupTest(
			<FilterActionRow
				defaultAction={{
					actionKeep: [{}]
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
		expect(defaultProps.setTempActions).not.toHaveBeenCalled();
	});
	it('should update actions using same action id as action at index number when selecting a new action', async () => {
		const mockCompProps: CompProps = {
			...defaultProps,
			tempActions: [
				{ id: '7', actionKeep: [{}] },
				{ id: '21', actionDiscard: [{}] },
				{ id: '33', actionRedirect: [{}] }
			]
		};
		const { user } = setupTest(
			<FilterActionRow
				defaultAction={{
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
			{ id: '7', actionKeep: [{}] },
			{ id: '21', actionDiscard: [{}] },
			{ id: '33', actionRedirect: [{}] }
		]);
	});

	it('should render only first action even if multiple actions are provided', () => {
		const mockCompProps: CompProps = {
			...defaultProps,
			tempActions: [
				{ id: '1', actionKeep: [{}] },
				{ id: '2', actionTag: [{}] },
				{ id: '3', actionRedirect: [{}] }
			]
		};
		setupTest(
			<FilterActionRow
				defaultAction={{
					actionKeep: [{}],
					actionTag: [{ tagName: 'tag 1' }],
					actionRedirect: [{ a: 'redirectTo@mail.com' }]
				}}
				index={0}
				compProps={mockCompProps}
			/>,
			{}
		);
		expect(screen.getByText('Keep in Inbox')).toBeVisible();
		expect(screen.queryByText('Tag with')).not.toBeInTheDocument();
		expect(screen.queryByText('Redirect to address')).not.toBeInTheDocument();
	});

	describe('Keep In Inbox', () => {
		it('should render the selected action', async () => {
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionKeep: [{}]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			const newLocal = await screen.findByText('Keep in Inbox');
			expect(newLocal).toBeVisible();
		});
	});
	describe('Redirect To Address', () => {
		it('should display action "Redirect To Address" when selected', async () => {
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionRedirect: [{ a: 'test@test.com' }]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			expect(screen.getByText(REDIRECT_TO_ADDRESS));
		});
		it('should not display Contact Input when dropdown option is different from "Redirect To Address"', async () => {
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionKeep: [{}]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			expect(screen.queryByTestId('filter-action-row-contact-input')).not.toBeInTheDocument();
		});
		it('should not display Contact Input when dropdown option is different from "Tag With"', async () => {
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionTag: [{ tagName: 'aaa' }]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			expect(screen.queryByTestId('filter-action-row-contact-input')).not.toBeInTheDocument();
		});
		it('should display Contact Input when selecting option "Redirect To Address"', async () => {
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionRedirect: [{ a: 'something' }]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			await screen.findByTestId('filter-action-row-contact-input');
		});
		it('should update actions after inserting a value in "Redirect To Address" input', async () => {
			const mockSetActions = jest.fn();
			const mockCompProps = {
				isIncoming: true,
				setTempActions: mockSetActions,
				tempActions: [],
				zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' as const
			};
			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
						actionRedirect: [{}]
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
				isIncoming: true,
				setTempActions: mockSetActions,
				tempActions: [],
				zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' as const
			};
			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
						actionRedirect: [{ a: 'anyvalue' }]
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
			const newCompProps: CompProps = {
				...defaultProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
			};

			setupTest(
				<FilterActionRow
					defaultAction={{
						actionRedirect: [{ a: 'aaa' }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			expect(screen.getByText('The Admin disabled the redirect action')).toBeVisible();
		});
		it('Redirect to address should not be the selected option if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			const newCompProps: CompProps = {
				...defaultProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
			};

			setupTest(
				<FilterActionRow
					defaultAction={{
						actionRedirect: [{ a: 'bbb' }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			expect(screen.queryByText(REDIRECT_TO_ADDRESS)).not.toBeInTheDocument();
		});

		it('should  display Keep in Inbox as selected option if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			const newCompProps: CompProps = {
				...defaultProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
			};

			setupTest(
				<FilterActionRow
					defaultAction={{
						actionRedirect: [{ a: 'ccc' }]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			expect(screen.getByText('Keep in Inbox')).toBeVisible();
		});

		it('Redirect to address should not be present in the dropdown options if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			const newCompProps: CompProps = {
				...defaultProps,
				tempActions: [{ id: '1', actionKeep: [{}] }],
				zimbraFeatureMailForwardingInFiltersEnabled: 'FALSE' as const
			};

			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
						actionKeep: [{}]
					}}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);
			await user.click(screen.getByText('Keep in Inbox'));

			expect(
				within(screen.getByTestId('dropdown-popper-list')).queryByText(REDIRECT_TO_ADDRESS)
			).not.toBeInTheDocument();
		});
	});
	describe('Tag With', () => {
		it('should display the saved tag', async () => {
			const filterName = 'Test Designer';
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionTag: [{ tagName: filterName }]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			expect(screen.getByText(filterName)).toBeVisible();
		});
		it('should display empty tag in input', async () => {
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionTag: [{ tagName: 'tag 1' }]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			expect(screen.getByText('Tag')).toBeVisible();
		});
		it('should reset the input value to empty after changing action', async () => {
			const newCompProps: CompProps = {
				...defaultProps,
				tempActions: [{ actionKeep: [{}] }]
			};
			const filterName = 'Test Designer';
			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
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

		it('should update tag action value if a new tag is selected', async () => {
			const newCompProps: CompProps = {
				...defaultProps,
				tempActions: []
			};
			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
						actionTag: [{ tagName: 'my tag' }]
					}}
					tagOptions={[{ label: 'Tag 1' }]}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			await user.click(screen.getByText('Tag'));
			await user.click(screen.getByText('Tag 1'));

			expect(defaultProps.setTempActions).toHaveBeenCalledTimes(1);
			expect(defaultProps.setTempActions).toHaveBeenCalledWith([
				{ actionTag: [{ tagName: 'Tag 1' }], id: undefined }
			]);
		});
		it('should update tag action value if a new tag is selected', async () => {
			const newCompProps = {
				...defaultProps,
				tempActions: []
			};
			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
						actionTag: [{ tagName: 'Tag to remove' }]
					}}
					tagOptions={[{ label: 'Tag 1' }]}
					index={0}
					compProps={newCompProps}
				/>,
				{}
			);

			await user.click(within(screen.getByTestId('tag-input')).getByTestId('icon: Close'));

			expect(defaultProps.setTempActions).toHaveBeenCalledTimes(1);
			expect(defaultProps.setTempActions).toHaveBeenCalledWith([
				{ actionTag: [{ tagName: '' }], id: undefined }
			]);
		});
	});
	describe('Move To Folder', () => {
		it('should update the action value with the selected folder on confirm', async () => {
			const store = generateStore();
			const folder = generateFolder({
				id: '100',
				name: 'Test folder',
				absFolderPath: '/my/folder/path'
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
			const mockCompProps: CompProps = {
				...defaultProps,
				tempActions: [
					{ id: '123', actionTag: [{}] },
					{ id: '456', actionDiscard: [{}] }
				]
			};
			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
						actionFileInto: [{ folderPath: '/my/path' }]
					}}
					index={1}
					compProps={mockCompProps}
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
			expect(defaultProps.setTempActions).toHaveBeenCalledWith([
				{ id: '123', actionTag: [{}] },
				{ actionFileInto: [{ folderPath: folder.absFolderPath }], id: '456' }
			]);
		});
	});
	describe('Discard', () => {
		it('should render the discard option if selected', async () => {
			setupTest(
				<FilterActionRow
					defaultAction={{
						actionDiscard: [{}]
					}}
					index={0}
					compProps={defaultProps}
				/>,
				{}
			);
			expect(await screen.findByText('Discard')).toBeVisible();
		});
		it('should render the the discard option after selecting it', async () => {
			const mockCompProps: CompProps = {
				...defaultProps,
				tempActions: [{ id: '1', actionKeep: [{}] }]
			};
			const { user } = setupTest(
				<FilterActionRow
					defaultAction={{
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
