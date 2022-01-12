import { createSpyObj } from '../../../test/helper/jest'
import { devices } from '../../../server/mpsserver'
import { ConnectedDevice } from '../../../amt/ConnectedDevice'
import { request } from './request'
import { startOptInResponse } from '../../../test/helper/wsmanResponses'

describe('request user consent code', () => {
  let resSpy
  let req
  let requestUserConsetCodeSpy
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = { params: { guid: '4c4c4544-004b-4210-8033-b6c04f504633' } }
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()

    devices['4c4c4544-004b-4210-8033-b6c04f504633'] = new ConnectedDevice(null, 'admin', 'P@ssw0rd')
    requestUserConsetCodeSpy = jest.spyOn(devices['4c4c4544-004b-4210-8033-b6c04f504633'], 'requestUserConsentCode')
  })

  it('should request user conset code', async () => {
    const result = {
      Header: startOptInResponse.Envelope.Header,
      Body: startOptInResponse.Envelope.Body.StartOptIn_OUTPUT
    }
    requestUserConsetCodeSpy.mockResolvedValueOnce(startOptInResponse.Envelope)
    await request(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
    expect(resSpy.json).toHaveBeenCalledWith(result)
  })
  it('Should give an error when return value is not 0', async () => {
    const result = {
      Header: {
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
        RelatesTo: '0',
        Action: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService/StartOptInResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-00000000008D',
        ResourceURI: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService'
      },
      Body: {
        StartOptIn_OUTPUT: {
          ReturnValue: '2',
          ReturnValueStr: 'NOT_READY'
        }
      }
    }
    const response = { Header: result.Header, Body: result.Body.StartOptIn_OUTPUT }
    requestUserConsetCodeSpy.mockResolvedValueOnce(result)
    await request(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(400)
    expect(resSpy.json).toHaveBeenCalledWith(response)
  })
  it('should get an error with status code 400, when failed to request user consent code', async () => {
    requestUserConsetCodeSpy.mockResolvedValueOnce(null)
    await request(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(400)
    expect(resSpy.json).toHaveBeenCalledWith({ error: 'Incorrect URI or Bad Request', errorDescription: 'Failed to request user consent code for guid : 4c4c4544-004b-4210-8033-b6c04f504633.' })
  })
  it('should get an error with status code 500 for an unexpected exception', async () => {
    requestUserConsetCodeSpy.mockImplementation(() => {
      throw new Error()
    })
    await request(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(500)
    expect(resSpy.json).toHaveBeenCalledWith({ error: 'Internal Server Error', errorDescription: 'Failed to request user consent code.' })
  })
})