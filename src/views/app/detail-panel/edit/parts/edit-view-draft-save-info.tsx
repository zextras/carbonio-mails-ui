/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useRef, useState } from 'react';

import { Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import moment from 'moment';

import * as StyledComp from './edit-view-styled-components';
import { TIMEOUTS } from '../../../../../constants';
import { DraftSaveProcessStatus } from '../../../../../types';

export const EditViewDraftSaveInfo: FC<{ processStatus?: DraftSaveProcessStatus }> = ({
	processStatus
}) => {
	const [visible, setVisible] = useState(false);
	const timeoutId = useRef<null | ReturnType<typeof setTimeout>>(null);

	useEffect(() => {
		console.log('@@@ processStatus', { processStatus });
		if (processStatus?.status === 'completed') {
			setVisible(true);
			timeoutId.current = setTimeout(() => setVisible(false), TIMEOUTS.DRAFT_INFO_HIDING_DELAY);
		}
		return () => {
			timeoutId.current && clearTimeout(timeoutId.current);
		};
	}, [processStatus]);

	return (
		<>
			{visible && (
				<StyledComp.StickyTimeContainer>
					<StyledComp.StickyTime>
						<Row
							crossAlignment="flex-end"
							background="gray5"
							padding={{ vertical: 'medium', horizontal: 'large' }}
						>
							<Text size="extrasmall" color="secondary">
								{t('message.email_saved_at', {
									time: moment(processStatus?.lastSaveTimestamp).format('LTS'),
									defaultValue: 'Email saved as draft at {{time}}'
								})}
							</Text>
						</Row>
					</StyledComp.StickyTime>
				</StyledComp.StickyTimeContainer>
			)}
		</>
	);
};
