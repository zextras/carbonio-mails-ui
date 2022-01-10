/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { CustomModal } from '@zextras/zapp-ui';

const ModalWrapper = ({ open, onClose, children }) => (
	<CustomModal open={open} onClose={onClose}>
		{children}
	</CustomModal>
);

export default ModalWrapper;
