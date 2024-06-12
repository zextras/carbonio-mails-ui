/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Row, Text } from '@zextras/carbonio-design-system';

export const BackupSearchPanelTextLine = ({
	title,
	text
}: {
	title: string;
	text: string | undefined;
}): React.JSX.Element => {
	const titleString = `${title} :\u00A0`;
	return text ? (
		<Row padding="small" mainAlignment="flex-start" width={'fill'}>
			<Text color="gray1" overflow="break-word" weight="bold" size="large">
				{titleString}
			</Text>
			<Text color="gray1" overflow="break-word" size="large">
				{text}
			</Text>
		</Row>
	) : (
		<></>
	);
};
