/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import axios from 'axios';

import { parse } from 'api/upload-attachments-api';
import { uploadFileApi } from 'api/upload-file-api';
import { convertToDecimal } from 'commons/utilities';

jest.mock('axios');
jest.mock('../upload-attachments-api');
jest.mock('../../commons/utilities');

describe('uploadFileApi', () => {
	it('returns attachment ID when upload is successful', async () => {
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		const response = { data: 'some response data' };
		(axios.post as jest.Mock).mockResolvedValue(response);
		(parse as jest.Mock).mockReturnValue([[], [], [{ aid: '12345' }]]);
		(convertToDecimal as jest.Mock).mockReturnValue('test.txt');

		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: '12345' });
	});

	it('returns default attachment ID when response is empty', async () => {
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		(axios.post as jest.Mock).mockResolvedValue(null);

		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: 'no aid found' });
	});

	it('handles file with no type', async () => {
		const file = new File(['content'], 'test.txt');
		const response = { data: 'some response data' };
		(axios.post as jest.Mock).mockResolvedValue(response);
		(parse as jest.Mock).mockReturnValue([[], [], [{ aid: '12345' }]]);
		(convertToDecimal as jest.Mock).mockReturnValue('test.txt');

		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: '12345' });
	});

	it('handles file with special characters in name', async () => {
		const file = new File(['content'], 'test@#$.txt', { type: 'text/plain' });
		const response = { data: 'some response data' };
		(axios.post as jest.Mock).mockResolvedValue(response);
		(parse as jest.Mock).mockReturnValue([[], [], [{ aid: '12345' }]]);
		(convertToDecimal as jest.Mock).mockReturnValue('test@#$.txt');

		const result = await uploadFileApi(file);

		expect(result).toEqual({ aid: '12345' });
	});
});
