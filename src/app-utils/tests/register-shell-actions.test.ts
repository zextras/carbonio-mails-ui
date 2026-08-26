/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addBoard, registerActions } from '@zextras/carbonio-shell-ui';

import { mockWindowLocation } from '@test-utils/utils/window';
import {
	mailToAction,
	mailToActionOnClick,
	mailToRecipientsAction,
	mailToRecipientsActionOnClick,
	newEmailAction,
	newEmailActionOnClick,
	registerShellActions
} from 'app-utils/register-shell-actions';
import { MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import * as sharedFunctions from 'integrations/shared-functions';

describe('registerShellActions', () => {
	it('should register the correct objects', async () => {
		registerShellActions();

		expect(registerActions).toHaveBeenCalledWith({
			action: expect.any(Function),
			id: 'mail-to',
			type: 'contact-list'
		});
		expect(registerActions).toHaveBeenCalledWith({
			action: expect.any(Function),
			id: 'mail-to',
			type: 'recipients'
		});
		expect(registerActions).toHaveBeenCalledWith({
			action: expect.any(Function),
			id: 'new-email',
			type: 'new'
		});
	});
});

describe('mailToRecipientsAction', () => {
	it('should return an object with disabled property set to false when arg is of MailDescription type', () => {
		const expectedMailToActionResult = {
			id: 'mail-to',
			label: 'label.send_mail',
			icon: 'MailModOutline',
			execute: expect.any(Function),
			disabled: false
		};
		expect(
			mailToRecipientsAction({
				recipients: [{ email: 'anymail', name: 'any', carbonCopy: false }],
				subject: 'any'
			})
		).toMatchObject(expectedMailToActionResult);
	});
	it('should return an object with disabled property set to true when there is no recipient', () => {
		const expectedMailToActionResult = {
			id: 'mail-to',
			label: 'label.send_mail',
			icon: 'MailModOutline',
			execute: expect.any(Function),
			disabled: true
		};
		expect(
			mailToRecipientsAction({
				recipients: [],
				subject: 'any'
			})
		).toMatchObject(expectedMailToActionResult);
	});
	it('should return an object with disabled property set to true when arg is not of MailDescription type', () => {
		const expectedMailToActionResult = {
			id: 'mail-to',
			label: 'label.send_mail',
			icon: 'MailModOutline',
			execute: expect.any(Function),
			disabled: true
		};
		expect(mailToRecipientsAction({})).toMatchObject(expectedMailToActionResult);
	});
});

describe('mailToAction', () => {
	it('should return an object with disabled property set to false when contacts is not an array', () => {
		const expectedMailToActionResult = {
			id: 'mail-to',
			label: 'label.send_mail',
			icon: 'MailModOutline',
			execute: expect.any(Function),
			disabled: false
		};
		expect(mailToAction({})).toMatchObject(expectedMailToActionResult);
	});

	it('should return an object with disabled property set to true when a contact does not have an address', () => {
		const expectedMailToActionResult = {
			id: 'mail-to',
			label: 'label.send_mail',
			icon: 'MailModOutline',
			execute: expect.any(Function),
			disabled: true
		};
		const contacts = [
			{ email: { email: { mail: 'anymail' } }, firstName: 'any', middleName: 'any' }
		];

		expect(mailToAction(contacts)).toMatchObject(expectedMailToActionResult);
	});
});

describe('mailToActionOnClick', () => {
	it('when called it should invoke mailToSharedFunction with the correct parameter', async () => {
		vi.spyOn(sharedFunctions, 'mailToSharedFunction');

		const contacts = [
			{ email: { email: { mail: 'anymail' } }, firstName: 'any', middleName: 'any' }
		];

		mailToActionOnClick({} as KeyboardEvent, contacts);
		const expectedMailToSharedFunctionArgument = [
			{ address: 'anymail', fullName: 'any any', type: 't' }
		];
		expect(sharedFunctions.mailToSharedFunction).toHaveBeenCalledWith(
			expectedMailToSharedFunctionArgument
		);
	});
});

describe('mailToRecipientsActionOnClick', () => {
	it('when called it should invoke mailToSharedFunction with the correct parameter', async () => {
		vi.spyOn(sharedFunctions, 'mailToSharedFunction');

		const recipients = [
			{ email: 'anymail', name: 'any', carbonCopy: false },
			{ email: 'anothermail', name: 'another', carbonCopy: true }
		];

		mailToRecipientsActionOnClick({} as KeyboardEvent, {
			recipients,
			subject: 'any subject'
		});
		const expectedRecipients = [
			{ address: 'anymail', fullName: 'any', type: 't' },
			{ address: 'anothermail', fullName: 'another', type: 'c' }
		];
		expect(sharedFunctions.mailToSharedFunction).toHaveBeenCalledWith(
			expectedRecipients,
			'any subject'
		);
	});
});

describe('newEmailAction', () => {
	it('when called it should return the correct object', () => {
		const expectedNewEmailActionResult = {
			id: 'new-email',
			label: 'label.new_email',
			icon: 'MailModOutline',
			execute: expect.any(Function),
			disabled: false,
			group: 'carbonio-mails-ui',
			primary: true
		};
		expect(newEmailAction()).toMatchObject(expectedNewEmailActionResult);
	});
});

describe('newEmailActionOnClick', () => {
	const originalLocation = window.location;

	afterEach(() => {
		mockWindowLocation(originalLocation);
	});

	it('when called it should invoke addBoard with the correct parameters', async () => {
		newEmailActionOnClick({} as KeyboardEvent);
		expect(addBoard).toHaveBeenCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'new'
				},
				title: 'label.new_email'
			})
		);
	});

	it('should set the id of the folder in focus in the board context', async () => {
		const folderId = 'a79fa996-e90e-4f04-97c4-c84209bb8277:2';
		// The shell is served under a base path, which is part of window.location.pathname
		mockWindowLocation({ pathname: `/carbonio/${MAILS_ROUTE}/folder/${folderId}` });

		newEmailActionOnClick({} as KeyboardEvent);

		expect(addBoard).toHaveBeenCalledWith(
			expect.objectContaining({
				context: expect.objectContaining({
					originAction: 'new',
					originFolderId: folderId
				})
			})
		);
	});

	it('should not set any folder id in the board context if the user is not on a folder', async () => {
		mockWindowLocation({ pathname: `/carbonio/${SEARCH_ROUTE}/any` });

		newEmailActionOnClick({} as KeyboardEvent);

		expect(addBoard).toHaveBeenCalledWith(
			expect.objectContaining({
				context: expect.objectContaining({
					originAction: 'new',
					originFolderId: undefined
				})
			})
		);
	});
});
