/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { FOLDER_VIEW, FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';

import { makeListItemsVisible, setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { populateFoldersStore } from '@test-utils/store/folders';
import { FilterAction } from 'types/filters';
import {
	FilterActionRow,
	FilterActionRowProps
} from 'views/settings/filters/parts/filter-action-row';
import { getActionTranslations } from 'views/settings/filters/parts/utils';

const REDIRECT_TO_ADDRESS = /Redirect To Address/i;

describe('FilterActionsRows', () => {
	const defaultAction: FilterAction = { actionKeep: [{}] };
	const defaultProps: FilterActionRowProps = {
		getOptionsTranslations: getActionTranslations(true),
		mailForwardingEnabled: 'TRUE' as const,
		selectedAction: defaultAction,
		onAddNewAction: vi.fn(),
		onRemoveAction: vi.fn(),
		onActionSwitch: vi.fn(),
		disableRemove: false,
		onActionValueChange: vi.fn()
	};
	it('should display filter actions', async () => {
		const testProps = {
			...defaultProps,
			tempActions: [{ actionKeep: [{}] }]
		};
		setupTest(<FilterActionRow {...testProps} />, {});
		expect(await screen.findByText('Keep in Inbox')).toBeInTheDocument();
	});
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
		const testProps = {
			...defaultProps,
			defaultAction: {
				actionFileInto: [{}]
			} as FilterAction
		};
		const { user } = setupTest(<FilterActionRow {...testProps} />, {});
		await user.click(screen.getByTestId('icon: MinusOutline'));

		expect(defaultProps.onRemoveAction).toHaveBeenCalledTimes(1);
	});
	it('disables the remove button when disableRemove is true', async () => {
		const testProps = {
			...defaultProps,
			disableRemove: true
		};

		const { user } = setupTest(<FilterActionRow {...testProps} />, {});

		const removeButton = screen
			.getAllByRole('button')
			.filter((button) => within(button).queryByTestId('icon: MinusOutline'))[0];
		expect(removeButton).toBeDisabled();
		await user.click(removeButton);
		expect(defaultProps.onRemoveAction).not.toHaveBeenCalled();
	});
	it('should call on switch with new chosen action when switching action', async () => {
		const { user } = setupTest(<FilterActionRow {...defaultProps} />, {});
		await user.click(screen.getByText('Keep in Inbox'));
		const dropdown = screen.getByTestId('dropdown-popper-list');
		await user.click(within(dropdown).getByText('Discard'));

		expect(defaultProps.onActionSwitch).toHaveBeenCalledWith({
			actionDiscard: [{}]
		});
	});

	it('should render the new chosen action when switching action', async () => {
		const { user } = setupTest(
			<FilterActionRow
				{...defaultProps}
				selectedAction={{
					actionTag: [{}]
				}}
			/>,
			{}
		);
		await user.click(screen.getByText(/Tag with/i));
		const dropdown = screen.getByTestId('dropdown-popper-list');
		await user.click(within(dropdown).getByText('Discard'));

		expect(screen.getByText('Discard')).toBeVisible();
	});

	it('should render tag when passing both actionTag and actionStop', async () => {
		setupTest(
			<FilterActionRow
				{...defaultProps}
				selectedAction={{
					actionStop: [{}],
					actionTag: [{}]
				}}
			/>,
			{}
		);
		expect(screen.getByText(/Tag with/i)).toBeVisible();
	});

	describe('Keep In Inbox', () => {
		it('should render the selected action', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionKeep: [{}]
					}}
				/>,
				{}
			);
			expect(await screen.findByText('Keep in Inbox')).toBeVisible();
		});
	});
	describe('Redirect To Address', () => {
		it('should display action "Redirect To Address" when selected', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionRedirect: [{ a: 'test@test.com' }]
					}}
				/>,
				{}
			);
			expect(screen.getByText(REDIRECT_TO_ADDRESS)).toBeVisible();
		});
		it('should not display Contact Input when dropdown option is different from "Redirect To Address"', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionKeep: [{}]
					}}
				/>,
				{}
			);
			expect(screen.queryByTestId('filter-action-row-contact-input')).not.toBeInTheDocument();
		});
		it('should display Contact Input when selecting option "Redirect To Address"', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionRedirect: [{ a: 'something' }]
					}}
				/>,
				{}
			);
			await screen.findByTestId('filter-action-row-contact-input');
		});
		it('should call on value change after inserting a value in "Redirect To Address" input', async () => {
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionRedirect: [{}]
					}}
				/>,
				{}
			);
			const redirectToAddressInput = await screen.findByTestId('filter-action-row-contact-input');
			await user.type(redirectToAddressInput, 'valid@email.it');
			await user.type(redirectToAddressInput, '[Enter]');
			expect(defaultProps.onActionValueChange).toHaveBeenCalledWith({
				actionRedirect: [{ a: 'valid@email.it' }],
				id: expect.any(String)
			});
		});
		it('should call on value change with empty address after clearing redirect to input', async () => {
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionRedirect: [{ a: 'anyvalue' }]
					}}
				/>,
				{}
			);
			const redirectToAddressInput = await screen.findByTestId('filter-action-row-contact-input');
			await user.type(redirectToAddressInput, 'valid@email.it');
			await user.type(redirectToAddressInput, '[Enter]');
			const chipRemoveIcon = within(redirectToAddressInput).getByTestId('icon: Close');
			await user.click(chipRemoveIcon);

			expect(defaultProps.onActionValueChange).toHaveBeenCalledWith({
				actionRedirect: [{ a: '' }],
				id: expect.any(String)
			});
		});
		it('should inform the user that redirect action is disabled when zimbraFeatureMailForwardingInFiltersEnabled is FALSE on an already existing filter with action redirect', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionRedirect: [{ a: 'aaa' }]
					}}
					mailForwardingEnabled={'FALSE'}
				/>,
				{}
			);

			expect(screen.getByText('The Admin disabled the redirect action')).toBeVisible();
		});
		it('Redirect to address should not be the selected option if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionRedirect: [{ a: 'bbb' }]
					}}
					mailForwardingEnabled={'FALSE'}
				/>,
				{}
			);

			expect(screen.queryByText(REDIRECT_TO_ADDRESS)).not.toBeInTheDocument();
		});
		it('should display Keep in Inbox as selected option if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionRedirect: [{ a: 'ccc' }]
					}}
					mailForwardingEnabled={'FALSE'}
				/>,
				{}
			);

			expect(screen.getByText('Keep in Inbox')).toBeVisible();
		});
		it('Redirect to address should not be present in the dropdown options if zimbraFeatureMailForwardingInFiltersEnabled is FALSE', async () => {
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionKeep: [{}]
					}}
					mailForwardingEnabled={'FALSE'}
				/>,
				{}
			);
			await user.click(screen.getByText('Keep in Inbox'));

			const dropdownList = screen.getByTestId('dropdown-popper-list');
			expect(within(dropdownList).queryByText(REDIRECT_TO_ADDRESS)).not.toBeInTheDocument();
		});
	});
	describe('Tag With', () => {
		it('should display the tag input when tag action selected', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionTag: [{}]
					}}
				/>,
				{}
			);
			expect(screen.getByText('Tag')).toBeVisible();
		});
		it('should display the saved tag', async () => {
			const tagName = 'Test Designer';
			const tagOptions = {
				[tagName]: {
					id: tagName,
					name: tagName,
					color: 0
				}
			};
			useTagStore.setState({ tags: tagOptions });
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionTag: [{ tagName }]
					}}
				/>,
				{}
			);
			expect(await screen.findByText(tagName)).toBeVisible();
		});

		it('should update tag action value if a new tag is selected', async () => {
			const tagOptions = {
				'Tag 1': {
					id: 'Tag 1',
					name: 'Tag 1',
					color: 0
				}
			};
			useTagStore.setState({ tags: tagOptions });
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionTag: [{ tagName: 'my tag' }]
					}}
				/>,
				{}
			);

			await user.click(screen.getByText('Tag'));
			await user.click(screen.getByText('Tag 1'));

			expect(defaultProps.onActionValueChange).toHaveBeenCalledTimes(1);
			expect(defaultProps.onActionValueChange).toHaveBeenCalledWith({
				actionTag: [{ tagName: 'Tag 1' }]
			});
		});
		it('should update tag action value if tag is removed', async () => {
			const tagName = 'Tag to remove';
			const tagOptions = {
				[tagName]: {
					id: tagName,
					name: tagName,
					color: 0
				}
			};
			useTagStore.setState({ tags: tagOptions });
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionTag: [{ tagName }]
					}}
				/>,
				{}
			);

			await user.click(within(screen.getByTestId('tag-input')).getByTestId('icon: Close'));

			expect(defaultProps.onActionValueChange).toHaveBeenCalledTimes(1);
			expect(defaultProps.onActionValueChange).toHaveBeenCalledWith({
				actionTag: [{ tagName: '' }]
			});
		});
	});
	describe('Move To Folder', () => {
		it('should update the action value with the selected folder on confirm', async () => {
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
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionFileInto: [{ folderPath: '/my/path' }]
					}}
				/>
			);
			const browseFolder = screen.getByRole('button', {
				name: /browse/i
			});
			await user.click(browseFolder);
			makeListItemsVisible();
			act(() => {
				vi.advanceTimersByTime(1000);
			});
			await user.click(screen.getByTestId(`folder-accordion-item-${folder.id}`));
			const chooseFolder = screen.getByRole('button', { name: 'Choose' });
			expect(chooseFolder).toBeEnabled();
			await user.click(chooseFolder);
			expect(defaultProps.onActionValueChange).toHaveBeenCalledWith({
				actionFileInto: [{ folderPath: folder.absFolderPath }]
			});
		});
	});

	describe('Mark as', () => {
		it('should update the action value with the first option of mark as when selecting "Mark as"', async () => {
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionKeep: [{}]
					}}
				/>,
				{}
			);
			await user.click(screen.getByText('Keep in Inbox'));
			await user.click(screen.getByText('Mark as'));
			expect(defaultProps.onActionSwitch).toHaveBeenCalledWith({
				actionFlag: [{ flagName: 'read' }]
			});
		});
	});
	describe('Discard', () => {
		it('should render the discard option if selected', async () => {
			setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionDiscard: [{}]
					}}
				/>,
				{}
			);
			expect(await screen.findByText('Discard')).toBeVisible();
		});
		it('should render the the discard option after selecting it', async () => {
			const { user } = setupTest(
				<FilterActionRow
					{...defaultProps}
					selectedAction={{
						actionKeep: [{}]
					}}
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
