/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';
import { Row, Icon, Text } from '@zextras/carbonio-design-system';

type LabelRowProps = {
	label: string;
	icon: string;
	text: string;
};

const LabelRow: FC<LabelRowProps> = ({ label, icon, text }): ReactElement => (
	<Row width="fill" mainAlignment="flex-start" padding={{ horizontal: 'small', bottom: 'small' }}>
		<Row padding={{ right: 'small' }}>
			<Icon icon={icon} />
		</Row>
		<Row takeAvailableSpace mainAlignment="flex-start" display="flex">
			<Text overflow="break-word" weight="bold">
				{label}
			</Text>
			<Text overflow="break-word">&nbsp;{text}</Text>
		</Row>
	</Row>
);
export default LabelRow;
