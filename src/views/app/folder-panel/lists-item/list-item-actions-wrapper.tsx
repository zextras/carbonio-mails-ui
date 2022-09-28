/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useContext, useMemo } from 'react';
import {
	Container,
	Tooltip,
	Dropdown,
	IconButton,
	ContainerProps
} from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { ActionsContext } from '../../../../commons/actions-context';
import { Conversation, IncompleteMessage, ListItemActionWrapperProps } from '../../../../types';

const HoverBarContainer = styled(Container)`
	top: 0;
	right: 0;
	display: none;
	position: absolute;
	background: linear-gradient(
		to right,
		transparent,
		${({ theme }): string => theme.palette.gray6.hover}
	);
	width: calc(100% - 64px);
	height: 45%;
	& > * {
		margin-top: ${({ theme }): string => theme.sizes.padding.small};
		margin-right: ${({ theme }): string => theme.sizes.padding.small};
	}
`;

const HoverContainer = styled(Container)<ContainerProps & { current: boolean }>`
	width: 100%;
	position: relative;
	cursor: pointer;
	text-decoration: none;
	background: ${({ current, theme }): string =>
		theme.palette[current ? 'highlight' : 'transparent']?.regular};
	&:hover {
		background: ${({ theme }): string => theme.palette.gray6.hover};
		& ${HoverBarContainer} {
			display: flex;
		}
	}
`;

export const ListItemActionWrapper: FC<ListItemActionWrapperProps> = ({
	children,
	current,
	onClick,
	onDoubleClick,
	item,
	isConversation,
	messagesToRender
}) => {
	const { getMessageActions, getConversationActions } = useContext(ActionsContext);

	const [hoverActions, dropdownActions] = useMemo(() => {
		if (isConversation) {
			return messagesToRender && messagesToRender?.length === 1
				? getMessageActions(
						{ ...(item as IncompleteMessage), ...messagesToRender?.[0], tags: item.tags },
						true
				  )
				: getConversationActions(item as Conversation, false);
		}
		return getMessageActions(
			item as IncompleteMessage,
			messagesToRender ? messagesToRender?.length > 1 : false
		);
	}, [isConversation, getMessageActions, item, messagesToRender, getConversationActions]);
	return (
		<Dropdown
			contextMenu
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			items={dropdownActions}
			display="block"
			style={{ width: '100%', height: '64px' }}
		>
			<HoverContainer
				data-testid={isConversation ? `ConversationRow` : `MessageListItem-${item.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				current={current ?? false}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
			>
				{children}
				{/* <Tooltip label={hoverTooltipLabel} overflow="break-word" maxWidth="50vw"> */}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
				>
					{hoverActions.map((action, index) => (
						<Tooltip key={action.id ?? index} label={action.label}>
							<IconButton
								key={action.id}
								icon={action.icon}
								onClick={(ev: SyntheticEvent<HTMLButtonElement, Event> | KeyboardEvent): void => {
									ev.stopPropagation();
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									action.click(ev);
								}}
								size="small"
							/>
						</Tooltip>
					))}
				</HoverBarContainer>
				{/* </Tooltip> */}
			</HoverContainer>
		</Dropdown>
	);
};
