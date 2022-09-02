/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useMemo } from 'react';
import { Button, ModalManagerContext, Container } from '@zextras/carbonio-design-system';
import { filter, isEqual, uniqWith } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { getShareInfo } from '../../store/actions/get-share-info';
import { ResFolder } from '../../types';
import { SharesModal } from './shares-modal';

export const ButtonFindShares: FC = () => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createModal = useContext(ModalManagerContext) as Function;

	const label = useMemo(() => t('label.find_shares', 'Find shares'), [t]);
	const openFindShares = useCallback(
		(ev: MouseEvent): void => {
			ev.stopPropagation();
			dispatch(getShareInfo())
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res: any) => {
					if (res.type.includes('fulfilled') && res.payload?.share?.length > 0) {
						const resFolders: Array<ResFolder> = uniqWith(
							filter(res.payload.share, ['view', 'message']),
							isEqual
						);
						const closeModal = createModal(
							{
								children: <SharesModal folders={resFolders} onClose={(): void => closeModal()} />
							},
							true
						);
					}
				});
		},
		[createModal, dispatch]
	);

	return (
		<Container padding={{ horizontal: 'medium', vertical: 'small' }}>
			<Button type="outlined" label={label} color="primary" size="fill" onClick={openFindShares} />
		</Container>
	);
};
