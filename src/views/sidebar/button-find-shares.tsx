/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Container, ModalManagerContext } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, isEqual, uniqWith } from 'lodash';
import React, { FC, SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { getShareInfo } from '../../store/actions/get-share-info';
import { ResFolder } from '../../carbonio-ui-commons/utils';
import { StoreProvider } from '../../store/redux';
import { SharesModal } from './shares-modal';

export const ButtonFindShares: FC = () => {
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createModal = useContext(ModalManagerContext) as Function;

	const label = useMemo(() => t('label.find_shares', 'Find shares'), []);
	const openFindShares = useCallback(
		(ev: SyntheticEvent<HTMLButtonElement, Event> | KeyboardEvent): void => {
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
								children: (
									<StoreProvider>
										<SharesModal folders={resFolders} onClose={(): void => closeModal()} />
									</StoreProvider>
								)
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
			<Button type="outlined" label={label} width="fill" color="primary" onClick={openFindShares} />
		</Container>
	);
};
