/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react-dom/test-utils';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { useIntegratedFunction } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { generateMessage } from '../../../tests/generators/generateMessage';
import {
	useMsgCreateAppointmentDescriptor,
	useMsgCreateAppointmentFn
} from '../use-msg-create-appointment';

describe('useMsgCreateAppointmentDescriptor', () => {
	it('Should return an object with specific id, icon, label and 2 functions', () => {
		const msg = generateMessage();

		const {
			result: { current: descriptor }
		} = setupHook(useMsgCreateAppointmentDescriptor, { initialProps: [msg, msg.parent] });

		expect(descriptor).toEqual({
			id: 'create-appointment',
			icon: 'CalendarModOutline',
			label: 'Create Appointment',
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});
});

describe('useMsgCreateAppointmentFn', () => {
	const msg = generateMessage({ isComplete: true });

	it('Should return an object with execute and canExecute functions', () => {
		const {
			result: { current: descriptor }
		} = setupHook(useMsgCreateAppointmentFn, { initialProps: [msg, msg.parent] });

		expect(descriptor).toEqual({
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});

	describe('canExecute', () => {
		it('should return false if the folder is draft', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgCreateAppointmentFn, {
				initialProps: [msg, FOLDERS.DRAFTS]
			});

			expect(functions.canExecute()).toEqual(false);
		});

		it('should return false if the folder is trash', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgCreateAppointmentFn, {
				initialProps: [msg, FOLDERS.TRASH]
			});

			expect(functions.canExecute()).toEqual(false);
		});

		it('should return false if the folder is not trash nor draft', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgCreateAppointmentFn, {
				initialProps: [msg, FOLDERS.INBOX]
			});

			expect(functions.canExecute()).toEqual(true);
		});
	});

	describe('execute', () => {
		it('should not call the integrated function if the action cannot be executed', async () => {
			populateFoldersStore();
			const openComposerSpy = jest.fn();
			useIntegratedFunction.mockImplementation((integratedFunctionId) => {
				if (integratedFunctionId === 'create_appointment') {
					return [openComposerSpy, true];
				}

				return [jest.fn(), true];
			});

			const {
				result: { current: functions }
			} = setupHook(useMsgCreateAppointmentFn, { initialProps: [msg, FOLDERS.DRAFTS] });

			await act(async () => {
				functions.execute();
			});

			expect(openComposerSpy).not.toHaveBeenCalled();
		});

		it('should call the API with the proper params if the action can be executed', async () => {
			populateFoldersStore();
			const openComposerSpy = jest.fn();
			useIntegratedFunction.mockImplementation((integratedFunctionId) => {
				if (integratedFunctionId === 'create_appointment') {
					return [openComposerSpy, true];
				}

				return [jest.fn(), true];
			});

			const {
				result: { current: functions }
			} = setupHook(useMsgCreateAppointmentFn, { initialProps: [msg, FOLDERS.INBOX] });

			await act(async () => {
				functions.execute();
			});

			expect(openComposerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					title: msg.subject,
					isRichText: true,
					richText: expect.any(String),
					attendees: expect.any(Array),
					optionalAttendees: expect.any(Array)
				})
			);
		});
	});
});
