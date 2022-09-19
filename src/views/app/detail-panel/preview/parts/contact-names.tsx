/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { capitalize, map } from 'lodash';
import React, { FC, ReactElement, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Row, Tooltip, Text } from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';

import { participantToString } from '../../../../../commons/utils';
import { Participant } from '../../../../../types';

const ContactSubText = styled(Text)`
	padding: 0 2px;
	overflow: initial;
	&:not(:last-child) {
		&:after {
			content: ',';
		}
	}
`;
const ContactName: FC<{
	showMoreCB?: (showMore: boolean) => void;
	showOverflow?: boolean;
	contacts: Participant[];
	label: string;
}> = ({ showMoreCB, showOverflow, contacts, label }): ReactElement => {
	const accounts = useUserAccounts();
	const toRef = useRef<HTMLInputElement>(null);
	const [isOverflow, setIsOverflow] = useState(false);
	useLayoutEffect(() => {
		if (toRef?.current?.clientWidth) {
			const rowOverflow = toRef?.current.scrollWidth > toRef?.current.clientWidth;
			if (showOverflow && rowOverflow) {
				showMoreCB && showMoreCB(true);
			}
			setIsOverflow(rowOverflow);
		}
	}, [showMoreCB, showOverflow]);

	return (
		<>
			<Row mainAlignment="flex-start">
				<Text color="secondary" size="small" style={{ paddingRight: '4px' }}>
					{label}
				</Text>
			</Row>
			<Row
				ref={toRef}
				mainAlignment="flex-start"
				takeAvailableSpace
				height="fit"
				orientation="vertical"
				display="flex"
				wrap={showOverflow ? 'nowrap' : 'wrap'}
				style={{
					lineHeight: '18px',
					flexDirection: 'row',
					overflow: 'hidden'
				}}
			>
				{map(contacts, (contact) => (
					<Tooltip label={contact.address} key={contact.address}>
						<ContactSubText color="secondary" size="small">
							{capitalize(participantToString(contact, t, accounts))}
						</ContactSubText>
					</Tooltip>
				))}
			</Row>
			{isOverflow && showOverflow && (
				<Text color="secondary" size="small" style={{ paddingLeft: '5px' }}>
					...
				</Text>
			)}
		</>
	);
};

export default ContactName;
