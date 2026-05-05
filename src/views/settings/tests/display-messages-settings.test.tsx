/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { DisplayMessagesSettings } from 'views/settings/display-messages-settings';

describe('Displaying messages settings', () => {
	const { prefs: settingsObj } = generateSettings({
		prefs: {
			zimbraPrefMailPollingInterval: '31536000',
			zimbraPrefConversationOrder: 'dateDesc',
			zimbraPrefMessageViewHtmlPreferred: 'TRUE',
			zimbraPrefMailSelectAfterDelete: 'next',
			zimbraPrefGroupMailBy: 'conversation',
			zimbraPrefMailInitialSearch: '',
			zimbraPrefMarkMsgRead: '0'
		}
	});
	it('should render the DisplayMessagesSettings component', async () => {
		setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={vi.fn()}
				updateProps={vi.fn()}
				updatedProps={{}}
			/>
		);

		expect(await screen.findByText('settings.label.display_messages')).toBeVisible();
	});

	it('should update conversation sorting when a new option is selected', async () => {
		const updateSettings = vi.fn();

		const { user } = setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={updateSettings}
				updateProps={vi.fn()}
				updatedProps={{}}
			/>
		);

		await user.click(screen.getByText('settings.label.conversation_ordering'));
		await user.click(screen.getByText('settings.conv_sort_option.asc'));

		expect(updateSettings).toHaveBeenCalledWith({
			target: { name: 'zimbraPrefConversationOrder', value: 'dateAsc' }
		});
	});

	it('should update check new mail interval when a new option is selected', async () => {
		const updateSettings = vi.fn();

		const { user } = setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={updateSettings}
				updateProps={vi.fn()}
				updatedProps={{}}
			/>
		);

		await user.click(screen.getByText('settings.new_mail_optn.manually'));
		await user.click(screen.getByText('settings.new_mail_optn.when_arrive'));

		expect(updateSettings).toHaveBeenCalledWith({
			target: { name: 'zimbraPrefMailPollingInterval', value: '500' }
		});
	});
	it('should update display mail preference when a new option is selected', async () => {
		const updateSettings = vi.fn();

		const { user } = setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={updateSettings}
				updateProps={vi.fn()}
				updatedProps={{}}
			/>
		);

		await user.click(screen.getByText('settings.display_mail_options.html'));
		await user.click(screen.getByText('settings.display_mail_options.text'));

		expect(updateSettings).toHaveBeenCalledWith({
			target: { name: 'zimbraPrefMessageViewHtmlPreferred', value: 'FALSE' }
		});
	});
	it('should update message selection preference when a new option is selected', async () => {
		const updateSettings = vi.fn();

		const { user } = setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={updateSettings}
				updateProps={vi.fn()}
				updatedProps={{}}
			/>
		);

		await user.click(screen.getByText('settings.msg_selection_optn.below_deleted'));
		await user.click(screen.getByText('settings.msg_selection_optn.above_deleted'));

		expect(updateSettings).toHaveBeenCalledWith({
			target: { name: 'zimbraPrefMailSelectAfterDelete', value: 'previous' }
		});
	});
	it('should update unsend time when a new option is selected', async () => {
		const updateProps = vi.fn();

		const { user } = setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={vi.fn()}
				updateProps={updateProps}
				updatedProps={{}}
			/>
		);

		await user.click(screen.getByText('settings.mail_unsend_time.second'));
		await user.click(screen.getByText('settings.mail_unsend_time.no_delay'));

		expect(updateProps).toHaveBeenCalledWith({
			target: {
				name: 'mails_snackbar_delay',
				value: {
					app: 'carbonio-mails-ui',
					value: '0'
				}
			}
		});
	});
	it('should update visualization options when a new radio button is selected', async () => {
		const updateSettings = vi.fn();

		const { user } = setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={updateSettings}
				updateProps={vi.fn()}
				updatedProps={{}}
			/>
		);

		await user.click(screen.getByText('label.by_message'));

		expect(updateSettings).toHaveBeenCalledWith({
			target: { name: 'zimbraPrefGroupMailBy', value: 'message' }
		});
	});

	it('should update mark as read preference when a new radio button is selected', async () => {
		const updateSettings = vi.fn();

		const { user } = setupTest(
			<DisplayMessagesSettings
				settingsObj={settingsObj as Record<string, string>}
				updateSettings={updateSettings}
				updateProps={vi.fn()}
				updatedProps={{}}
			/>
		);

		await user.click(screen.getByText('settings.label.mark_manually'));

		expect(updateSettings).toHaveBeenCalledWith({
			target: { name: 'zimbraPrefMarkMsgRead', value: '-1' }
		});
	});
});
