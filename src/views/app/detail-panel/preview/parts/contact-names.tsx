/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useLayoutEffect, useRef, useState } from 'react';

import { Row, Tooltip, Text } from '@zextras/carbonio-design-system';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { capitalize, map } from 'lodash';
import styled from 'styled-components';

import { participantWithAddressToString } from '../../../../../commons/utils';
import type { Participant } from '../../../../../types';

const ContactSubText = styled(Text)`
	padding: 0 0.125rem;
	overflow: initial;
	&:not(:last-child) {
		&:after {
			content: ',';
		}
	}
`;
const ContactName: FC<{
	showOverflow?: boolean;
	contacts: Participant[];
	label: string;
}> = ({ showOverflow, contacts, label }): ReactElement => {
	const accounts = useUserAccounts();
	const toRef = useRef<HTMLInputElement>(null);
	const [isOverflow, setIsOverflow] = useState(false);
	useLayoutEffect(() => {
		if (toRef?.current?.clientWidth) {
			const rowOverflow = toRef?.current.scrollWidth > toRef?.current.clientWidth;
			setIsOverflow(rowOverflow);
		}
	}, [showOverflow]);

	return (
		<>
			<Row mainAlignment="flex-start">
				<Text color="secondary" size="small" style={{ paddingRight: '0.25rem' }}>
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
					lineHeight: '1.125rem',
					flexDirection: 'row',
					overflow: 'hidden'
				}}
			>
				{map(contacts, (contact, index) => (
					<Tooltip label={contact.address} key={index}>
						<ContactSubText color="secondary" size="small">
							{participantWithAddressToString(contact, accounts)}
						</ContactSubText>
					</Tooltip>
				))}
			</Row>
			{isOverflow && showOverflow && (
				<Text color="secondary" size="small" style={{ paddingLeft: '0.3125rem' }}>
					...
				</Text>
			)}
		</>
	);
};

export default ContactName;
