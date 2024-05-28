/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Avatar, Container, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { find, noop } from 'lodash';

import { DeletedMessage } from '../../../../store/backup-search-slice';
import { getUserAccount } from '@zextras/carbonio-shell-ui';

type BackupSearchMessageListItemProps = {
	item: DeletedMessage;
	selected: DeletedMessage;
	selecting: boolean;
	// toggle: (id: string) => void;
	// deselectAll: () => void;
};

function extractEmail(text: string): string | null {
	const emailRegex =
		// eslint-disable-next-line @typescript-eslint/no-unused-vars, max-len, no-control-regex
		/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
	const match = text.match(emailRegex);
	return match ? match[0] : null;
}

export const BackupSearchMessageListItem = ({
	item,
	selected,
	selecting
	// toggle,
	// deselectAll
}: BackupSearchMessageListItemProps): React.JSX.Element => {
	const emailTo = extractEmail(item.to);
	const emailFrom = extractEmail(item.sender);
	const accountName = getUserAccount()?.name;
	const emailToDisplay = find([emailTo, emailFrom], (email) => email !== accountName);
	const dateToDisplay = new Date(item?.creationDate).toLocaleDateString();
	const isSelected = selected === item;

	return (
		<Container orientation="horizontal" mainAlignment="flex-start" padding={{ all: 'medium' }}>
			<div style={{ alignSelf: 'center' }}>
				<Avatar
					selecting={selecting}
					selected={isSelected}
					label={item.to}
					colorLabel={item.to}
					onClick={noop}
					size="large"
				/>
			</div>
			<Row wrap="wrap" takeAvailableSpace padding={{ left: 'medium' }}>
				<Container height="fit" width="fill" crossAlignment="flex-start">
					<Row wrap="nowrap" takeAvailableSpace width="fill" mainAlignment="space-between">
						<Text size="medium">{emailToDisplay}</Text>
						<Text size="small">{dateToDisplay}</Text>
					</Row>
					<Padding bottom="small" />
					<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
						<Text size="medium">{item?.subject}</Text>
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
