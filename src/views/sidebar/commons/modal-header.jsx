/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Divider,
	Text,
	Row,
	IconButton,
	Padding,
	Container
} from '@zextras/carbonio-design-system';
import React from 'react';

export const ModalHeader = ({ title, onClose }) => (
	<Container mainAlignment="space-between" width="100%">
		<Row takeAvailableSpace mainAlignment="space-between" width="100%">
			<Row width="calc(100% - 24px)" takeAvailableSpace mainAlignment="flex-start">
				<Text weight="bold" size="large">
					{title}
				</Text>
			</Row>
			<Row mainAlignment="flex-start">
				<IconButton
					size="medium"
					style={{ padding: 0, margin: 0 }}
					onClick={onClose}
					icon="CloseOutline"
				/>
			</Row>
		</Row>
		<Padding top="medium" />
		<Divider />
		<Padding bottom="medium" />
	</Container>
);
