/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactChildren, FC } from 'react';
import { CustomModal } from '@zextras/carbonio-design-system';

const ModalWrapper: FC<{ open: boolean; onClose: () => void; children: ReactChildren }> = ({
	open,
	onClose,
	children
}) => (
	<CustomModal open={open} onClose={onClose}>
		{children}
	</CustomModal>
);

export default ModalWrapper;
