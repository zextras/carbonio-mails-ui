/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Dropdown, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useContext, useMemo } from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { ActionsContext } from '../../../../commons/actions-context';
import { ListItemActionWrapperProps } from '../../../../types';

const HoverBarContainer = styled(Container)<{ background: keyof DefaultTheme['palette'] }>`
	top: 0;
	right: 0;
	display: none;
	position: absolute;
	background: linear-gradient(
		to right,
		transparent,
		${({ background, theme }): string => theme.palette[background].hover}
	);
	width: calc(100% - 4rem);
	height: 45%;

	& > * {
		margin-top: ${({ theme }): string => theme.sizes.padding.small};
		margin-right: ${({ theme }): string => theme.sizes.padding.small};
	}
`;

const HoverContainer = styled(Container).attrs(() => ({
	background: 'transparent'
}))<{ $hoverBackground: keyof DefaultTheme['palette'] }>`
	width: 100%;
	position: relative;
	cursor: pointer;
	text-decoration: none;

	&:hover {
		background: ${({ $hoverBackground, theme }): string => theme.palette[$hoverBackground].hover};

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
				? getMessageActions({ ...item, ...messagesToRender?.[0], tags: item.tags }, true)
				: getConversationActions(item, false);
		}
		return getMessageActions(item, messagesToRender ? messagesToRender?.length > 1 : false);
	}, [isConversation, getMessageActions, item, messagesToRender, getConversationActions]);

	return (
		<Dropdown
			contextMenu
			items={dropdownActions}
			display="block"
			style={{ width: '100%', height: '4rem' }}
		>
			<HoverContainer
				data-testid={isConversation ? `ConversationRow` : `MessageListItem-${item.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				$hoverBackground={current ? 'highlight' : 'gray6'}
			>
				{children}
				{/* <Tooltip label={hoverTooltipLabel} overflow="break-word" maxWidth="50vw"> */}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
					background={current ? 'highlight' : 'gray6'}
				>
					{hoverActions.map((action, index) => (
						<Tooltip key={action.id ?? index} label={action.label}>
							<IconButton
								key={action.id}
								icon={action.icon}
								onClick={(ev): void => {
									ev.stopPropagation();
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
