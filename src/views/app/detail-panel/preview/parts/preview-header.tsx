/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, SyntheticEvent, useCallback, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Avatar, Container, Padding, Row, Text, getColor } from '@zextras/carbonio-design-system';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';
import { find, isEmpty } from 'lodash';
import { useParams } from 'react-router-dom';

import { TagsInExpandedHeader } from './header-tags';
import { PreviewHeaderActions } from './preview-header-actions';
import { useContainerWidth } from './utils';
import type { DetailPanelRoutesParams } from '../../../../../types/routes';
import { participantToString } from 'commons/utils';
import { getNoIdentityPlaceholder } from 'helpers/identities';
import { MailMessage } from 'types/messages';
import { useGetTagsList } from 'ui-actions/tag-actions';
import { ContactChip } from 'views/app/detail-panel/preview/parts/contact-names-chips';
import { MailInfoBlock } from 'views/app/detail-panel/preview/parts/info-block/mail-info-block';
import MessageContactsList from 'views/app/detail-panel/preview/parts/message-contact-list';
import OnBehalfOfDisplayer from 'views/app/detail-panel/preview/parts/on-behalf-of-displayer';

const HoverContainer = styled(Container)<{ $isExpanded: boolean }>`
	cursor: pointer;
	border-radius: ${({ $isExpanded }): string => ($isExpanded ? '0.25rem 0.25rem 0 0' : '0.25rem')};
	&:hover {
		background: ${({ theme, background = 'currentColor' }): string =>
			getColor(`${background}.hover`, theme)};
	}
`;

type PreviewHeaderProps = {
	message: MailMessage;
	onClick: (e: SyntheticEvent) => void;
	open: boolean;
	isEml?: boolean;
};

const fallbackContact = {
	type: ParticipantRole.FROM,
	address: '',
	displayName: getNoIdentityPlaceholder(),
	fullName: ''
};

export const PreviewHeader: FC<PreviewHeaderProps> = ({
	message,
	onClick,
	open,
	isEml
}): ReactElement => {
	const containerRef = useRef<HTMLDivElement>(null);
	const accounts = useUserAccounts();
	const { folderId } = useParams<DetailPanelRoutesParams>() as DetailPanelRoutesParams;

	const [isContactListExpand, setIsContactListExpand] = useState(false);
	const isWide = useContainerWidth(containerRef, 550);
	const tags = useGetTagsList(message.tags);

	const mainContact = find(message.participants, ['type', 'f']) || fallbackContact;
	const senderContact = find(message.participants, ['type', 's']);

	const _onClick = useCallback(
		(e: React.MouseEvent) => !e.isDefaultPrevented() && onClick(e),
		[onClick]
	);

	const contactListExpandCB = useCallback((contactListExpand: boolean) => {
		setIsContactListExpand(contactListExpand);
	}, []);

	return (
		<Row width="fill">
			<HoverContainer
				height="fit"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				background="gray6"
				$isExpanded={open}
				data-testid={`open-message-${message.id}`}
				onClick={_onClick}
			>
				<Container height="fit" width="100%" ref={containerRef}>
					<Container orientation="horizontal">
						<Container
							width="fit"
							height={isContactListExpand && !isWide ? '100%' : 'fit'}
							mainAlignment={isContactListExpand && !isWide ? 'flex-start' : 'center'}
							padding={{ all: 'small' }}
						>
							<Avatar
								label={mainContact.fullName || mainContact.address || getNoIdentityPlaceholder()}
								colorLabel={mainContact.address || getNoIdentityPlaceholder()}
								size="small"
							/>
						</Container>
						<Row height="fit" minHeight="32px" padding={{ vertical: 'small' }} takeAvailableSpace>
							<Container orientation="horizontal" mainAlignment="space-between" width="fill">
								<Row
									style={{
										overflow: 'hidden'
									}}
									mainAlignment="flex-start"
									wrap="nowrap"
								>
									{isEmpty(senderContact) ? (
										<Row
											takeAvailableSpace
											orientation={isContactListExpand && !isWide ? 'vertical' : 'horizontal'}
											width="fit"
											crossAlignment="flex-start"
											mainAlignment="flex-start"
											wrap="nowrap"
										>
											<Text
												data-testid="SenderText"
												size={message.read ? 'small' : 'medium'}
												color={message.read ? 'text' : 'primary'}
												weight={message.read ? 'regular' : 'bold'}
											>
												{participantToString(mainContact, accounts)}
											</Text>
											{!isContactListExpand && (
												<Row
													takeAvailableSpace
													width="fit"
													mainAlignment="flex-start"
													wrap="nowrap"
													padding={{ left: 'small' }}
												>
													<Text color="gray1" size={message.read ? 'small' : 'medium'}>
														{mainContact.address}
													</Text>
												</Row>
											)}
											{isContactListExpand &&
												mainContact.address &&
												(isWide ? (
													<>
														<Padding left="small" />
														<ContactChip contact={mainContact} isExpanded />
													</>
												) : (
													<Row takeAvailableSpace mainAlignment="flex-start" wrap="nowrap">
														<ContactChip contact={mainContact} isExpanded={false} />
													</Row>
												))}
										</Row>
									) : (
										<OnBehalfOfDisplayer compProps={{ senderContact, message, mainContact }} />
									)}
								</Row>
								{!isEml && (
									<PreviewHeaderActions message={message} tags={tags} open={open} isWide={isWide} />
								)}
							</Container>
						</Row>
					</Container>
					<TagsInExpandedHeader isEml={isEml} tags={tags} open={open} isWide={isWide} />
				</Container>
				<Container
					orientation="horizontal"
					padding={{ horizontal: 'small' }}
					mainAlignment="flex-start"
				>
					{!open && (
						<Row padding={{ bottom: 'small' }}>
							<Text color="secondary" size="small">
								{message.fragment}
							</Text>
						</Row>
					)}
					{open && (
						<MessageContactsList
							message={message}
							folderId={folderId}
							contactListExpandCB={contactListExpandCB}
							isWide={isWide}
						/>
					)}
				</Container>
				<MailInfoBlock msg={message} />
			</HoverContainer>
		</Row>
	);
};
