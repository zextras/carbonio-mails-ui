/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { noop } from 'lodash';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
// import * as customComponent from '../date-picker-custom-component';
import { SendLaterModal } from '../send-later-modal';

// jest.mock('../date-picker-custom-component', () => {
// 	const { forwardRef } = jest.requireActual('react');
// 	return {
// 		__esModule: true,
// 		default: forwardRef((props, ref) => <div ref={ref} />)
// 	};
// });

// jest.mock('@zextras/carbonio-design-system/DateTimePicker', () => <div />);

describe('send-later-modal', () => {
	it('all elements of the component are visible', async () => {
		const closeModal = jest.fn();
		const store = generateStore();

		// jest.spyOn(customComponent, 'DatePickerCustomComponent').mockImplementation(() => <div />);
		setupTest(<SendLaterModal onClose={(): void => closeModal()} onAutoSendTimeSelected={noop} />, {
			store
		});

		const modalTitle = screen.getByText(/label\.send_later/i);
		expect(modalTitle).toBeInTheDocument();

		const confirmButton = screen.getByRole('button', {
			name: /label\.schedule_send/i
		});
		expect(confirmButton).toBeInTheDocument();

		const cancelButton = screen.getByRole('button', {
			name: /label\.cancel/i
		});
		expect(cancelButton).toBeEnabled();
	});
});
