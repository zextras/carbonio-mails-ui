/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useCallback, useMemo } from 'react';

import { Avatar, Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';
import styled from 'styled-components';

import { getFolderIdParts } from 'helpers/folders';
import type { ItemAvatarType, Participant } from 'types/index.d';
import { TooltipWrapper } from 'views/app/folder-panel/parts/tooltip-wrapper';

const AvatarElement = styled(Avatar)`
	width: 2.625rem !important;
	height: 2.625rem !important;
	min-width: 2.625rem !important;
	min-height: 2.625rem !important;
	p {
		font-size: 0.875rem;
	}
`;

export type ItemAvatarTypeProps = {
	item: any;
	selected: boolean;
	selecting: boolean;
	folderId: string;
	index?: number;
	onSelect?: (index: number, id: string, event: React.MouseEvent) => void;
	toggle?: (id: string) => void;
};

export const ItemAvatar: FC<ItemAvatarTypeProps> = ({
	item,
	selected,
	selecting,
	folderId,
	index,
	onSelect,
	toggle
}) => {
	const targetParticipants =
		getFolderIdParts(folderId).id === FOLDERS.SPAM ? ParticipantRole.TO : ParticipantRole.FROM;
	const [avatarLabel, avatarEmail] = useMemo(() => {
		let sender = item?.participants?.find((p: Participant) => p.type === targetParticipants);
		if (!sender) [sender] = item.participants ?? [];
		return [sender?.fullName || sender?.name || sender?.address || '.', sender?.address];
	}, [item.participants, targetParticipants]);

	const activateSelectionMode = t('label.activate_selection_mode', 'Activate selection mode');

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			if (toggle) {
				toggle(item.id);
			}
			if (onSelect) {
				onSelect(index ?? 0, item.id, e);
			}
		},
		[toggle, onSelect, item, index]
	);

	return (
		<Container
			mainAlignment="center"
			crossAlignment="center"
			data-testid={`AvatarContainer`}
			padding={{ all: 'small' }}
		>
			<TooltipWrapper label={activateSelectionMode} enabled={!selecting} maxWidth="100%">
				<AvatarElement
					selecting={selecting}
					selected={selected}
					label={avatarLabel}
					colorLabel={avatarEmail}
					onClick={handleClick}
					size="large"
				/>
			</TooltipWrapper>
		</Container>
	);
};
