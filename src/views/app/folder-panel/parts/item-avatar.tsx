/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useCallback, useMemo } from 'react';

import { Avatar, Container } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { TooltipWrapper } from './tooltip-wrapper';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { getFolderIdParts } from '../../../../helpers/folders';
import type { ItemAvatarType, Participant } from '../../../../types';

const AvatarElement = styled(Avatar)`
	width: 2.625rem !important;
	height: 2.625rem !important;
	min-width: 2.625rem !important;
	min-height: 2.625rem !important;
	p {
		font-size: 0.875rem;
	}
`;

export const ItemAvatar: FC<ItemAvatarType> = ({ item, selected, selecting, toggle, folderId }) => {
	const targetParticipants =
		getFolderIdParts(folderId).id === FOLDERS.SPAM ? ParticipantRole.TO : ParticipantRole.FROM;
	const [avatarLabel, avatarEmail] = useMemo(() => {
		let sender = item?.participants?.find((p: Participant) => p.type === targetParticipants);
		if (!sender) [sender] = item.participants ?? [];
		return [sender?.fullName || sender?.name || sender?.address || '.', sender?.address];
	}, [item.participants, targetParticipants]);

	const conversationSelect = useCallback(
		(id: string) => (ev: SyntheticEvent) => {
			ev.preventDefault();
			toggle && toggle(id);
		},
		[toggle]
	);

	const activateSelectionMode = t('label.activate_selection_mode', 'Activate selection mode');

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
					onClick={conversationSelect(item.id)}
					size="large"
				/>
			</TooltipWrapper>
		</Container>
	);
};
