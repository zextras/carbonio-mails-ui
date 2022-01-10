/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Divider, Text, Row, IconButton, Padding } from '@zextras/zapp-ui';
import React from 'react';

export const ModalHeader = ({ title, onClose }) => (
	<Row orientation="horizontal" mainAlignment="space-between" takeAvailableSpace width="100%">
		<Text weight="bold" size="large">
			{title}
		</Text>
		<IconButton
			size="medium"
			style={{ padding: 0, margin: 0 }}
			onClick={onClose}
			icon="CloseOutline"
		/>
		<Divider />
		<Padding bottom="medium" />
	</Row>
);
