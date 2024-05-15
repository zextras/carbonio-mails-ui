/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Avatar, Container, Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { DeletedMessage } from '../../../../api/search-backup-deleted-messages';

type BackupSearchMessageListItemProps = {
	item: DeletedMessage;
	// selected: DeletedMessage;
	// selecting: boolean;
	// toggle: (id: string) => void;
	// deselectAll: () => void;
};
const AvatarElement = styled(Avatar)`
	width: 2.625rem !important;
	height: 2.625rem !important;
	min-width: 2.625rem !important;
	min-height: 2.625rem !important;
	p {
		font-size: 0.875rem;
	}
`;
export const BackupSearchMessageListItem = ({
	item
	// selected,
	// selecting,
	// toggle,
	// deselectAll
}: BackupSearchMessageListItemProps): React.JSX.Element => (
	// const isSelected = selected === item;
	<Container mainAlignment="flex-start" data-testid={`MessageListItem-${item.messageId}`}>
		<div style={{ alignSelf: 'center' }} data-testid={`message-list-item-avatar-${item.messageId}`}>
			<AvatarElement
				// selecting={selecting}
				// selected={isSelected}
				label={item.to}
				// colorLabel={item.to}
				// onClick={noop}
				// size="large"
			/>
			<Padding horizontal="extrasmall" />
		</div>
		<Row
			wrap="wrap"
			orientation="horizontal"
			takeAvailableSpace
			padding={{ left: 'small', top: 'small', bottom: 'small', right: 'large' }}
		>
			<Container orientation="horizontal" height="fit" width="fill">
				<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start">
					<Text>{item?.sender}</Text>
				</Row>
				<Row>
					<Padding left="small">
						<Text size="extrasmall">{item.subject}</Text>
					</Padding>
				</Row>
			</Container>
			<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
				<Row wrap="nowrap" takeAvailableSpace mainAlignment="flex-start" crossAlignment="center">
					<Padding right="extrasmall">
						<Icon icon={'mailOutline'} />
					</Padding>
					<Row
						wrap="nowrap"
						takeAvailableSpace
						mainAlignment="flex-start"
						crossAlignment="baseline"
					>
						<Text>{item.fragment}</Text>
					</Row>
				</Row>
			</Container>
		</Row>
	</Container>
);
