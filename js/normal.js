$(function () {

    // 生日、第一次缴费日期验证
    $("#firstPayMonth").val(1);
    $("#birthdayYear, #firstPayYear").on("change", function () {
        var year = $(this).val().trim();
        if (!(year >= 0 && year < 9999)) {
            $(this).addClass("is-invalid");
        } else {
            $(this).removeClass("is-invalid");
        }
    });
    $("#birthdayDay, #firstPayDay").on("change", function () {
        var day = $(this).val().trim();
        if (!(day > 0 && day <= 31)) {
            $(this).addClass("is-invalid");
        } else {
            $(this).removeClass("is-invalid");
        }
    });

    $("#birthdayYear").val(new Date().getFullYear());
    $("#firstPayYear").val(new Date().getFullYear());

    $(".addIncomeType .dropdown-item").on("click", function () {
        $(".dropdown-menu").removeClass("show").addClass("hide");
        var tmpClass = $(this).attr("data-class");
        $("#benefit").append($("." + tmpClass).first().clone());
    });
    $("#benefit").on("click", ".remove_income", function () {
        $(this).parents(".form-group").first().remove();
    })

    /*下拉菜单*/
//下拉
    $(".addAIncome").click(function () {
        if ($(".dropdown-menu").hasClass('hide')) {
            $(".dropdown-menu").removeClass("hide").addClass("show");
        }
        else {
            $(".dropdown-menu").removeClass("show").addClass("hide");
        }
    });

    $(".dropdown-menu .dropdown-item").click(function () {
        $(".dropdown-menu").removeClass("show").addClass("hide");
    });

//点击空白消失
    $(document).mouseup(function (e) {
        var _con = $(".dropdown-menu");
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
            $(".dropdown-menu").removeClass("show").addClass("hide");
        }
    });

    var policyMonthlyAge = 0;
    // 开始比较
    $("#flip").on("click", function () {
        var tmpStr = $("#flip").text();
        $("#flip").text("计算中...");
        $(".tableList").removeClass("hide");
        $(".tableList tbody").html("");

        // 读取缴费方式
        var payType = {};
        payType.isPayEveryMonth = Boolean($(".data-isPayEveryMonth").val() == "1");
        payType.payMoney = parseInt($(".data-payMoney").val());
        payType.payTotalTimes = parseInt($(".data-payTotalTimes").val());
        payType.payTimes = 0;

        // 读取收益
        var benefits = [];
        for (var i = 0; i < 5; i++)
            benefits[i] = [];
        readBenefits(benefits);

        // 按月利率计算
        var isMonthlyInterestRate = $(".isMonthlyInterestRate").val();
        var monthlyInterestRate = $(".interestRate").val();
        if (monthlyInterestRate == "")
            monthlyInterestRate = $(".interestRate").attr("placeholder");
        if (isMonthlyInterestRate == 0)
            monthlyInterestRate = Math.pow((1 + monthlyInterestRate / 100), 1 / 12) - 1;

        // 这里进行计算，先不校验输入数据正确性了
        var birthdayDate = new Date($("#birthdayYear").val(), $("#birthdayMonth").val(), $("#birthdayDay").val());
        var date = new Date($("#firstPayYear").val(), $("#firstPayMonth").val(), $("#firstPayDay").val());
        var firstPayDate = date.getDate();
        policyMonthlyAge = 0;
        // console.log(date.toLocaleDateString());

        // list virable
        var yearAndMonth, age, payMoney, income, bankBalance = 0, monthlyInterest;
        while ((age = (date.getFullYear() - birthdayDate.getFullYear() - (date.getMonth() < birthdayDate.getMonth() ? 1 : 0))) < 100) {
            yearAndMonth = date.getFullYear() + "." + (date.getMonth() + 1);
            payMoney = calculatePayMoney(payType, date);
            income = calculateGainMoney(benefits, date, birthdayDate, age);
            monthlyInterest = bankBalance * monthlyInterestRate;
            bankBalance = bankBalance + payMoney - income + monthlyInterest;

            addARowToList(yearAndMonth, age + "周岁" + (date.getMonth() + 12 - birthdayDate.getMonth()) % 12 +"个月", payMoney, income, bankBalance, monthlyInterest);
            monthPlusPlus(date, firstPayDate);
        }

        $("#flip").text(tmpStr);
    });

    function addARowToList(yearAndMonth, age, payMoney, income, bankBalance, monthlyInterest) {
        var tmp = "<tr>\n";
        if (policyMonthlyAge % 12 == 0)
            tmp = "<tr class=\"table-active\">\n"
        $(".tableList tbody").append(tmp +
            "            <th>" + yearAndMonth + "</th>\n" +
            "            <td>" + age + "</td>\n" +
            "            <td>" + payMoney + "</td>\n" +
            "            <td>" + income + "</td>\n" +
            "            <td>" + bankBalance.toFixed(2) + "</td>\n" +
            "            <td>" + monthlyInterest.toFixed(2) + "</td>\n" +
            "        </tr>");
    }

    function calculateGainMoney(benefits, date, birthdayDate, age) {
        var res = 0;
        var isBirthdayFirstRound = date.getMonth() == birthdayDate.getMonth();
        var isPolicyFirstRound = policyMonthlyAge % 12 == 0;
        var policyAge = Math.floor(policyMonthlyAge / 12);
        if (isBirthdayFirstRound) {
            for (var i = 0; i < benefits[0].length; i++) {
                if (benefits[0][i].age == age)
                    res += benefits[0][i].gainMoney;
            }
        }
        for (var i = 0; i < benefits[1].length; i++) {
            if ((!benefits[1][i].isEveryMonth && isBirthdayFirstRound) || benefits[1][i].isEveryMonth) {
                if (benefits[1][i].ageStart <= age && benefits[1][i].ageEnd >= age) {
                    res += benefits[1][i].gainMoney;
                }
            }
        }
        for (var i = 0; i < benefits[2].length; i++) {
            if ((!benefits[2][i].isEveryMonth && isBirthdayFirstRound) || benefits[2][i].isEveryMonth) {
                if (benefits[2][i].ageStart <= age && benefits[2][i].times < benefits[2][i].totalTimes) {
                    benefits[2][i].times++;
                    res += benefits[2][i].gainMoney;
                }
            }
        }
        for (var i = 0; i < benefits[3].length; i++) {
            if ((!benefits[3][i].isEveryMonth && isPolicyFirstRound) || benefits[3][i].isEveryMonth) {
                if (benefits[3][i].policyAnniversaryStart <= policyAge && benefits[3][i].times < benefits[3][i].totalTimes) {
                    benefits[3][i].times++;
                    res += benefits[3][i].gainMoney;
                }
            }
        }
        for (var i = 0; i < benefits[4].length; i++) {
            if ((!benefits[4][i].isEveryMonth && isPolicyFirstRound) || benefits[4][i].isEveryMonth) {
                if (benefits[4][i].policyAnniversaryStart <= policyAge && benefits[4][i].policyAnniversaryEnd >= policyAge) {
                    res += benefits[4][i].gainMoney;
                }
            }
        }
        return res;
    }

    function calculatePayMoney(payType, date) {
        var res = 0;
        var isPolicyFirstRound = policyMonthlyAge % 12 == 0;
        if ((!payType.isPayEveryMonth && isPolicyFirstRound) || payType.isPayEveryMonth) {
            if (payType.payTimes < payType.payTotalTimes) {
                payType.payTimes++;
                res += payType.payMoney;
            }
        }
        return res;
    }

    function monthPlusPlus(date, firstPayDate) {
        policyMonthlyAge++;
        date.setMonth(date.getMonth() + 1);
        if (date.getDate() > 20 && date.getDate() < firstPayDate)
            date.setDate(firstPayDate);
        if (date.getDate() < firstPayDate)
            date.setDate(0);
    }

    function readBenefits(benefits) {
        $("#benefit .income_1").each(function () {
            var atAge = parseInt($(this).find(".data-atAge").val());
            var gainMoney = parseInt($(this).find(".data-gainMoney").val());
            benefits[0][benefits[0].length] = {"age": atAge, "gainMoney": gainMoney};
        });
        $("#benefit .income_2").each(function () {
            var ageStart = parseInt($(this).find(".data-ageStart").val());
            var ageEnd = parseInt($(this).find(".data-ageEnd").val());
            var isEveryMonth = Boolean($(this).find(".data-isEveryMonth").val() == "1");
            var gainMoney = parseInt($(this).find(".data-gainMoney").val());
            benefits[1][benefits[1].length] = {
                "ageStart": ageStart,
                "ageEnd": ageEnd,
                "isEveryMonth": isEveryMonth,
                "gainMoney": gainMoney
            };
        });
        $("#benefit .income_3").each(function () {
            var ageStart = parseInt($(this).find(".data-ageStart").val());
            var isEveryMonth = Boolean($(this).find(".data-isEveryMonth").val() == "1");
            var gainMoney = parseInt($(this).find(".data-gainMoney").val());
            var totalTimes = parseInt($(this).find(".data-totalTimes").val());
            benefits[2][benefits[2].length] = {
                "ageStart": ageStart,
                "isEveryMonth": isEveryMonth,
                "gainMoney": gainMoney,
                "totalTimes": totalTimes,
                "times": 0
            };
        });
        $("#benefit .income_4").each(function () {
            var policyAnniversaryStart = parseInt($(this).find(".data-policyAnniversaryStart").val());
            var isEveryMonth = Boolean($(this).find(".data-isEveryMonth").val() == "1");
            var gainMoney = parseInt($(this).find(".data-gainMoney").val());
            var totalTimes = parseInt($(this).find(".data-totalTimes").val());
            benefits[3][benefits[3].length] = {
                "policyAnniversaryStart": policyAnniversaryStart,
                "isEveryMonth": isEveryMonth,
                "gainMoney": gainMoney,
                "totalTimes": totalTimes,
                "times": 0
            };
        });
        $("#benefit .income_5").each(function () {
            var policyAnniversaryStart = parseInt($(this).find(".data-policyAnniversaryStart").val());
            var policyAnniversaryEnd = parseInt($(this).find(".data-policyAnniversaryEnd").val());
            var isEveryMonth = Boolean($(this).find(".data-isEveryMonth").val() == "1");
            var gainMoney = parseInt($(this).find(".data-gainMoney").val());
            benefits[4][benefits[4].length] = {
                "policyAnniversaryStart": policyAnniversaryStart,
                "policyAnniversaryEnd": policyAnniversaryEnd,
                "isEveryMonth": isEveryMonth,
                "gainMoney": gainMoney
            };
        });
    }
});