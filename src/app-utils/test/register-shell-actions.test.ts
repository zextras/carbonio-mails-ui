/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addBoard, registerActions } from '@zextras/carbonio-shell-ui';

import * as sharedFunctions from '../../integrations/shared-functions';
import {
	mailToAction,
	mailToActionOnClick,
	newEmailAction,
	newEmailActionOnClick,
	registerShellActions
} from '../register-shell-actions';

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
			id: 'new-email',
			type: 'new'
		});
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
		jest.spyOn(sharedFunctions, 'mailToSharedFunction');

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
});
