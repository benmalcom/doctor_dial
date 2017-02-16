/**
 * Created by Ekaruztech on 7/18/2016.
 */

exports.do =  function(dataMeta,data)
{
        var response  = {},
            meta = {};

        if(dataMeta.found)
        {
            meta.found = dataMeta.found;
        }
        if(dataMeta.message)
        {
            meta.message = dataMeta.message;
        }
        if(dataMeta.statusCode)
        {
            meta.status_code = dataMeta.statusCode;
        }
        if(dataMeta.success)
        {
            meta.success = dataMeta.success;
        }

        if(dataMeta.token)
        {
            meta.token = dataMeta.token;
        }

        if(dataMeta.totalCount)
        {
            meta.total_count = dataMeta.totalCount;
        }
        if(dataMeta.pagination)
        {
            response.pagination = dataMeta.pagination;
        }
        if(dataMeta.error)
        {
            response.error = dataMeta.error;
        }

        response._meta = meta;
        if(data)
        {
            response.data = data;
        }
        return response;
};


exports.general =  function(info)
{
    var response = {};
    if(info.statusCode)
    {
        response.status_code = info.statusCode;
    }
    if(info.success)
    {
        meta.success = info.success;
    }
    if(info.message)
    {
        meta.message = info.message;
    }
    if(info.errors)
    {
        response.errors = info.errors;
    }
    if(info.extra)
    {
        response.extra = info.extra;
    }
    return response;
};


function statusToMessage(statusCode)
{
    var message = "";
    if(statusCode)
    {
        switch (statusCode)
        {
            case 200:
                message = "Request OK";
                break;
            case 201:
                message = "New resource created";
                break;
            case 404:
                message = "Resource not found";
                break;
            case 401:
                message = "Unauthorized Request";
                break;
            case 400:
                message = "Bad request";
                break;
            case 503:
                message = "Internal server error"
        }
    }

    return message;
}